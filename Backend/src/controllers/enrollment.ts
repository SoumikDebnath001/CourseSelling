import { Request, Response } from "express";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { Topic } from "../models/Topic";
import { Enrollment } from "../models/Enrollment";
import { CourseProgress } from "../models/CourseProgress";
import { CertificateRecord } from "../models/CertificateRecord";
import { PhysicalAssessmentApplication } from "../models/PhysicalAssessmentApplication";
import { paymentProvider } from "../services/payment";
import { isCourseUnlockedForUser, getLevels } from "../utils/progression";
import { levelLabel } from "../config/levels";
import { signThumbnail, signCourseAssets } from "../utils/storage";
import { canAccessCourseContent } from "../utils/access";
import { sendMailAsync } from "../mail/mailSender";
import { courseEnrollmentEmail } from "../mail/templates";

/**
 * Student: enrol in a course. Goes through the payment seam (free today) and then
 * creates our own enrollment + progress docs in *_appTwo collections. Never writes
 * to the existing app's user/enrollment collections.
 */
export const enroll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.id;
  const course = await Course.findById(req.params.courseId);
  if (!course || course.status !== "Published") throw new ApiError(404, "Course not available");

  const existing = await Enrollment.findOne({ userId, course: course._id, status: "active" });
  if (existing) return res.json({ success: true, message: "Already enrolled", enrollment: existing });

  // Progression gate: a user can only enrol in courses unlocked for their category level
  // (unless an admin has granted direct access).
  const unlocked = await isCourseUnlockedForUser(userId, course);
  if (!unlocked) {
    throw new ApiError(403, "This course is locked. Complete previous levels and earn the required points to unlock it.");
  }

  const intent = await paymentProvider.charge({ userId, courseId: course._id.toString(), amount: course.price });
  if (!intent.paid) throw new ApiError(402, "Payment required");

  const enrollment = await Enrollment.create({
    userId,
    course: course._id,
    paymentRef: intent.reference,
    amountPaid: intent.amount,
  });
  await CourseProgress.updateOne(
    { userId, course: course._id },
    { $setOnInsert: { completedTopics: [], passedTests: [] } },
    { upsert: true }
  );
  await Course.updateOne({ _id: course._id }, { $inc: { studentsEnrolledCount: 1 } });

  sendMailAsync(
    req.auth!.email,
    ...Object.values(courseEnrollmentEmail(req.auth!.name, course.courseName, course.slug)) as [string, string]
  );

  res.status(201).json({ success: true, enrollment });
});

/** Student: my enrolled courses with progress summary. */
export const myEnrolledCourses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.id;
  const enrollments = await Enrollment.find({ userId, status: "active" })
    .populate({
      path: "course",
      select: "courseName slug thumbnail courseDescription modules courseType level category certificateColor",
      populate: { path: "category", select: "name slug" },
    })
    .lean();

  // Courses the user has fully completed (certificate earned) — drives Certifications.
  const certs = await CertificateRecord.find({ userId }).select("course").lean();
  const completedSet = new Set(certs.map((c) => c.course.toString()));

  const result = [];
  for (const e of enrollments) {
    const course = e.course as unknown as { _id: string; courseName: string; slug: string; thumbnail?: { url?: string; publicId?: string } };
    if (!course) continue;
    signThumbnail(course);
    const totalTopics = await Topic.countDocuments({ course: course._id });
    const progress = await CourseProgress.findOne({ userId, course: course._id }).lean();
    const completed = progress?.completedTopics?.length ?? 0;
    result.push({
      course,
      totalTopics,
      completedTopics: completed,
      percent: totalTopics ? Math.round((completed / totalTopics) * 100) : 0,
      completed: completedSet.has(course._id.toString()),
    });
  }
  res.json({ success: true, courses: result });
});

/** Student: purchase history — every enrollment (active + cancelled) as a transaction. */
export const myTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.id;
  const enrollments = await Enrollment.find({ userId })
    .populate({ path: "course", select: "courseName slug" })
    .sort({ enrolledAt: -1 })
    .lean();

  const transactions = enrollments
    .filter((e) => e.course)
    .map((e) => {
      const course = e.course as unknown as { _id: string; courseName: string; slug: string };
      return {
        id: e._id.toString(),
        // Stable, human-friendly invoice number derived from the enrollment id + date.
        invoiceNo: `INV-${new Date(e.enrolledAt).getFullYear()}-${e._id.toString().slice(-6).toUpperCase()}`,
        course: { _id: course._id, courseName: course.courseName, slug: course.slug },
        amountPaid: e.amountPaid,
        paymentRef: e.paymentRef,
        status: e.status,
        date: e.enrolledAt,
      };
    });

  res.json({ success: true, transactions });
});

/** Student/Admin: full course content (videos + resources) — gated by enrollment. */
export const getFullCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.courseId)
    .populate("category", "name slug")
    .populate({
      path: "modules",
      options: { sort: { order: 1 } },
      populate: [
        { path: "topics", options: { sort: { order: 1 } } },
        { path: "test", select: "title description scope passingScorePct timeLimitMins isPublished" },
      ],
    })
    .populate("finalTest", "title description scope passingScorePct timeLimitMins isPublished")
    .populate("sections.finalTest", "title description scope passingScorePct timeLimitMins isPublished")
    .lean();
  if (!course) throw new ApiError(404, "Course not found");

  // Enforce access: only enrolled students (or admins) may pull full content,
  // including the video URLs below. Without this, any logged-in user could read
  // a paid course in full just by hitting this endpoint with its id.
  if (!(await canAccessCourseContent(req.auth, course._id))) {
    throw new ApiError(403, "Enrol in this course to access its content");
  }

  // Swap stored ids for short-lived signed URLs (thumbnail, file resources, and paid videos)
  // so private R2 assets are reachable and paid videos can't be freely shared.
  signCourseAssets(course as Parameters<typeof signCourseAssets>[0], { videos: true });

  const userId = req.auth!.id;
  const progress = await CourseProgress.findOne({ userId, course: course._id }).lean();
  const completedTopics = new Set((progress?.completedTopics ?? []).map(String));
  const passedTests = new Set((progress?.passedTests ?? []).map(String));

  const [certs, apps, levels] = await Promise.all([
    CertificateRecord.find({ userId, course: course._id }).select("level").lean(),
    PhysicalAssessmentApplication.find({ userId, course: course._id })
      .select("level scope status whatsappCountryCode whatsappNumber")
      .lean(),
    getLevels(),
  ]);
  const certLevels = new Set(certs.map((c) => c.level));
  const appByLevel = new Map(apps.map((a) => [a.level, a]));

  // Per-module completion: a module with a published test is done when the test is passed;
  // otherwise when all its topics are complete (mirrors creditProgress).
  type PTest = { _id: unknown; isPublished?: boolean } | null;
  type PMod = { _id: unknown; section?: string | null; test?: PTest; topics?: { _id: unknown }[] };
  type PSection = { levelKey: string; order: number; requiresPhysicalAssessment: boolean; finalTest?: PTest };
  const pmods = (course.modules as unknown as PMod[]) ?? [];
  const moduleDone = (m: PMod): boolean => {
    if (m.test && m.test.isPublished) return passedTests.has(String(m.test._id));
    const ts = m.topics ?? [];
    return ts.length > 0 && ts.every((t) => completedTopics.has(String(t._id)));
  };

  // Sequential section status for progressive courses (locked until the previous cert is earned).
  let prevCertified = true;
  const sectionStatus = [...((course.sections as unknown as PSection[]) ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((sec) => {
      const secModules = pmods.filter((m) => m.section === sec.levelKey);
      const modulesDone = secModules.length > 0 && secModules.every(moduleDone);
      const ft = sec.finalTest;
      const finalOk = !ft || !ft.isPublished || passedTests.has(String(ft._id));
      const app = appByLevel.get(sec.levelKey) ?? null;
      const physOk = !sec.requiresPhysicalAssessment || app?.status === "cert_approved";
      const certificateEarned = certLevels.has(sec.levelKey);
      const locked = !prevCertified;
      prevCertified = certificateEarned;
      return {
        levelKey: sec.levelKey,
        label: levelLabel(levels, sec.levelKey),
        order: sec.order,
        requiresPhysicalAssessment: sec.requiresPhysicalAssessment,
        locked,
        modulesDone,
        finalOk,
        complete: modulesDone && finalOk && physOk,
        certificateEarned,
        physicalAssessment: app
          ? { status: app.status, whatsappCountryCode: app.whatsappCountryCode, whatsappNumber: app.whatsappNumber }
          : null,
      };
    });

  res.json({
    success: true,
    course,
    progress: {
      completedTopics: [...completedTopics],
      passedTests: [...passedTests],
    },
    sectionStatus,
    certificateLevels: [...certLevels],
    physicalAssessments: apps.map((a) => ({
      level: a.level,
      scope: a.scope,
      status: a.status,
      whatsappCountryCode: a.whatsappCountryCode,
      whatsappNumber: a.whatsappNumber,
    })),
  });
});
