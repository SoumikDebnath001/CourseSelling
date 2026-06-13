import { Request, Response } from "express";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { Topic } from "../models/Topic";
import { Enrollment } from "../models/Enrollment";
import { CourseProgress } from "../models/CourseProgress";
import { paymentProvider } from "../services/payment";
import { signedVideoUrl } from "../utils/storage";
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
    .populate({ path: "course", select: "courseName slug thumbnail courseDescription modules" })
    .lean();

  const result = [];
  for (const e of enrollments) {
    const course = e.course as unknown as { _id: string; courseName: string; slug: string; thumbnail?: unknown };
    if (!course) continue;
    const totalTopics = await Topic.countDocuments({ course: course._id });
    const progress = await CourseProgress.findOne({ userId, course: course._id }).lean();
    const completed = progress?.completedTopics?.length ?? 0;
    result.push({
      course,
      totalTopics,
      completedTopics: completed,
      percent: totalTopics ? Math.round((completed / totalTopics) * 100) : 0,
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
    .lean();
  if (!course) throw new ApiError(404, "Course not found");

  // Swap stored CDN URLs for short-lived signed URLs so paid videos can't be
  // shared. No-op (returns the plain CDN URL) until signing keys are configured.
  type LeanTopic = { videoUrl?: string; videoPublicId?: string };
  type LeanModule = { topics?: LeanTopic[] };
  for (const m of (course.modules as unknown as LeanModule[]) ?? []) {
    for (const t of m.topics ?? []) {
      if (t.videoPublicId) t.videoUrl = signedVideoUrl(t.videoPublicId);
    }
  }

  const userId = req.auth!.id;
  const progress = await CourseProgress.findOne({ userId, course: course._id }).lean();
  res.json({
    success: true,
    course,
    progress: {
      completedTopics: progress?.completedTopics?.map(String) ?? [],
      passedTests: progress?.passedTests?.map(String) ?? [],
    },
  });
});
