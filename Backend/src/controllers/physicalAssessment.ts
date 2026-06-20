import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Course } from "../models/Course";
import { PhysicalAssessmentApplication } from "../models/PhysicalAssessmentApplication";
import { canAccessCourseContent } from "../utils/access";
import { creditProgress, getLevels } from "../utils/progression";
import { levelLabel } from "../config/levels";

const submitSchema = z.object({
  courseId: z.string().min(1),
  scope: z.enum(["course", "section"]),
  level: z.string().optional(),
  whatsappCountryCode: z.string().min(1).max(6),
  whatsappNumber: z.string().min(4).max(20),
});

/**
 * Student: apply to take the offline physical assessment for a course (miscellaneous) or a
 * section (progressive). Upserts a single application per (user, course, level) — resubmitting
 * updates the contact number but never resets an admin decision.
 */
export const submitApplication = asyncHandler(async (req: Request, res: Response) => {
  const body = submitSchema.parse(req.body);
  const userId = req.auth!.id;

  if (!(await canAccessCourseContent(req.auth, body.courseId))) {
    throw new ApiError(403, "Enrol in this course before applying");
  }
  const course = await Course.findById(body.courseId).select("courseType level sections requiresPhysicalAssessment").lean();
  if (!course) throw new ApiError(404, "Course not found");

  // Resolve and validate the level the application is for.
  let level: string;
  if (body.scope === "section") {
    if (!body.level || !course.sections?.some((s) => s.levelKey === body.level)) {
      throw new ApiError(400, "Unknown section for this course");
    }
    level = body.level;
  } else {
    level = course.level;
  }

  const application = await PhysicalAssessmentApplication.findOneAndUpdate(
    { userId, course: course._id, level },
    {
      $set: {
        whatsappCountryCode: body.whatsappCountryCode.trim(),
        whatsappNumber: body.whatsappNumber.trim(),
      },
      $setOnInsert: {
        userId,
        course: course._id,
        scope: body.scope,
        level,
        studentName: req.auth!.name ?? "Student",
        status: "pending",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ success: true, application });
});

/** Admin: list physical-assessment applications, filtered by approval state. */
export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const filter = req.query.filter === "approved" ? "approved" : "pending";
  const statusMatch =
    filter === "approved" ? { status: "cert_approved" } : { status: { $in: ["pending", "test_approved"] } };

  const apps = await PhysicalAssessmentApplication.find(statusMatch)
    .populate("course", "courseName slug")
    .sort({ updatedAt: -1 })
    .lean();

  const levels = await getLevels();
  const applications = apps.map((a) => {
    const course = a.course as unknown as { _id: unknown; courseName: string } | null;
    return {
      _id: String(a._id),
      studentName: a.studentName,
      whatsappCountryCode: a.whatsappCountryCode,
      whatsappNumber: a.whatsappNumber,
      scope: a.scope,
      level: a.level,
      levelLabel: levelLabel(levels, a.level),
      status: a.status,
      course: course ? { _id: String(course._id), courseName: course.courseName } : null,
      createdAt: (a as { createdAt?: Date }).createdAt,
    };
  });

  res.json({ success: true, applications });
});

const decide = (status: "test_approved" | "cert_approved") =>
  asyncHandler(async (req: Request, res: Response) => {
    const app = await PhysicalAssessmentApplication.findById(req.params.id);
    if (!app) throw new ApiError(404, "Application not found");
    app.status = status;
    app.decidedByAdmin = req.auth!.id as never;
    app.decidedAt = new Date();
    await app.save();

    // Approving for the certificate may now satisfy the certificate gate — re-credit progress
    // so the unblocked certificate is issued immediately.
    if (status === "cert_approved") {
      await creditProgress(app.userId, app.course);
    }

    res.json({ success: true, application: app });
  });

/** Admin: stage 1 — approve the student to sit the offline physical test. */
export const approveForTest = decide("test_approved");

/** Admin: stage 2 — they passed; unlock/issue the certificate. */
export const approveForCertificate = decide("cert_approved");
