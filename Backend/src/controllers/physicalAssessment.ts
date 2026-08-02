import crypto from "crypto";
import { Request, Response } from "express";
import QRCode from "qrcode";
import { z } from "zod";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Course } from "../models/Course";
import { PhysicalAssessmentApplication, IPhysicalAssessmentApplication } from "../models/PhysicalAssessmentApplication";
import { canAccessCourseContent } from "../utils/access";
import { creditProgress, getLevels } from "../utils/progression";
import { levelLabel } from "../config/levels";
import { generateOtp, hashOtp, otpExpiry, isOtpValid } from "../utils/otp";
import { sendMailAsync } from "../mail/mailSender";
import { env } from "../config/env";
import { physicalAssessmentScheduledEmail, physicalAssessmentOtpEmail, physicalAssessmentResultEmail } from "../mail/templates";

const MAX_OTP_ATTEMPTS = 5;

const submitSchema = z.object({
  courseId: z.string().min(1),
  scope: z.enum(["course", "section"]),
  level: z.string().optional(),
  whatsappCountryCode: z.string().min(1).max(6),
  whatsappNumber: z.string().min(4).max(20),
});

function formatScheduledDate(d: Date): string {
  return new Date(d).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function courseLabelFor(app: IPhysicalAssessmentApplication): Promise<string> {
  const course = await Course.findById(app.course).select("courseName").lean();
  const name = course?.courseName ?? "your course";
  if (app.scope === "section") {
    const levels = await getLevels();
    return `${name} — ${levelLabel(levels, app.level)}`;
  }
  return name;
}

/**
 * Student: apply to take the offline physical assessment for a course (miscellaneous) or a
 * section (progressive). One application per (user, course, level): resubmitting while
 * `revoked` is rejected; resubmitting a `failed` application resets it to `pending` for a
 * clean re-review (a "redo"); any other status just refreshes the contact details.
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

  const existing = await PhysicalAssessmentApplication.findOne({ userId, course: course._id, level });
  if (existing?.revoked) {
    throw new ApiError(403, "This application has been closed by the academy. Please contact support.");
  }

  const contact = {
    whatsappCountryCode: body.whatsappCountryCode.trim(),
    whatsappNumber: body.whatsappNumber.trim(),
    email: req.auth!.email,
  };

  let application: IPhysicalAssessmentApplication;
  if (existing) {
    Object.assign(existing, contact);
    if (existing.status === "failed") {
      existing.status = "pending";
      existing.scheduledDate = null;
      existing.qrToken = null;
      existing.otpHash = null;
      existing.otpExpiry = null;
      existing.otpAttempts = 0;
      existing.otpVerifiedAt = null;
    }
    await existing.save();
    application = existing;
  } else {
    application = await PhysicalAssessmentApplication.create({
      userId,
      course: course._id,
      scope: body.scope,
      level,
      studentName: req.auth!.name ?? "Student",
      status: "pending",
      ...contact,
    });
  }

  res.status(201).json({ success: true, application });
});

/** Admin: list physical-assessment applications, filtered by approval state. */
export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const filter = req.query.filter === "approved" ? "approved" : "pending";
  const statusMatch =
    filter === "approved" ? { status: "cert_approved" } : { status: { $in: ["pending", "scheduled", "failed"] } };

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
      scheduledDate: a.scheduledDate ?? null,
      qrToken: a.qrToken ?? null,
      otpVerifiedAt: a.otpVerifiedAt ?? null,
      revoked: a.revoked ?? false,
      course: course ? { _id: String(course._id), courseName: course.courseName } : null,
      createdAt: (a as { createdAt?: Date }).createdAt,
    };
  });

  res.json({ success: true, applications });
});

const scheduleSchema = z.object({ scheduledDate: z.coerce.date() });

/** Admin: review a pending application, pick a date, and email the student a check-in QR. */
export const scheduleAssessment = asyncHandler(async (req: Request, res: Response) => {
  const body = scheduleSchema.parse(req.body);
  const app = await PhysicalAssessmentApplication.findById(req.params.id);
  if (!app) throw new ApiError(404, "Application not found");
  if (app.revoked) throw new ApiError(400, "This application has been revoked");
  if (app.status !== "pending") throw new ApiError(400, "Only pending applications can be scheduled");

  app.status = "scheduled";
  app.scheduledDate = body.scheduledDate;
  app.qrToken = crypto.randomBytes(16).toString("hex"); // rotates on every (re)schedule — invalidates any earlier QR
  app.otpHash = null;
  app.otpExpiry = null;
  app.otpAttempts = 0;
  app.otpVerifiedAt = null;
  app.decidedByAdmin = req.auth!.id as never;
  app.decidedAt = new Date();
  await app.save();

  const verifyUrl = `${env.CLIENT_URL}/admin/physical-assessments/verify/${app._id}?token=${app.qrToken}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 240, errorCorrectionLevel: "M" });
  const qrCid = `qr-${app._id}-${Date.now()}`;
  const label = await courseLabelFor(app);
  const mail = physicalAssessmentScheduledEmail(app.studentName, label, formatScheduledDate(app.scheduledDate), qrCid);
  sendMailAsync(app.email, mail.subject, mail.html, [
    { filename: "check-in-qr.png", content: qrBuffer, cid: qrCid, contentType: "image/png" },
  ]);

  res.json({ success: true, application: app });
});

/**
 * Admin: load an application from its QR link (scanned with a phone camera, or opened
 * manually from the list). While `scheduled`, the token must match the live QR round —
 * once a result has been recorded the page becomes a read-only summary and the token no
 * longer matters.
 */
export const getVerifyDetails = asyncHandler(async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const app = await PhysicalAssessmentApplication.findById(req.params.id).populate("course", "courseName").lean();
  if (!app) throw new ApiError(404, "Application not found");
  if (app.status === "scheduled" && (!app.qrToken || app.qrToken !== token)) {
    throw new ApiError(403, "Invalid or expired verification link");
  }

  const levels = await getLevels();
  const course = app.course as unknown as { _id: unknown; courseName: string } | null;
  res.json({
    success: true,
    application: {
      _id: String(app._id),
      studentName: app.studentName,
      whatsappCountryCode: app.whatsappCountryCode,
      whatsappNumber: app.whatsappNumber,
      scope: app.scope,
      level: app.level,
      levelLabel: levelLabel(levels, app.level),
      status: app.status,
      scheduledDate: app.scheduledDate ?? null,
      otpVerifiedAt: app.otpVerifiedAt ?? null,
      revoked: app.revoked ?? false,
      course: course ? { _id: String(course._id), courseName: course.courseName } : null,
    },
  });
});

const tokenSchema = z.object({ token: z.string().min(1) });

/** Admin: fire from the verify page to email a fresh check-in code to the student. */
export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const body = tokenSchema.parse(req.body);
  const app = await PhysicalAssessmentApplication.findById(req.params.id);
  if (!app) throw new ApiError(404, "Application not found");
  if (app.revoked) throw new ApiError(400, "This application has been revoked");
  if (app.status !== "scheduled") throw new ApiError(400, "This application is not awaiting check-in");
  if (!app.qrToken || app.qrToken !== body.token) throw new ApiError(403, "Invalid or expired verification link");

  const otp = generateOtp();
  app.otpHash = hashOtp(otp);
  app.otpExpiry = otpExpiry();
  app.otpAttempts = 0;
  app.otpVerifiedAt = null;
  await app.save();

  const mail = physicalAssessmentOtpEmail(app.studentName, otp);
  sendMailAsync(app.email, mail.subject, mail.html);

  res.json({ success: true });
});

const verifyOtpSchema = z.object({ token: z.string().min(1), otp: z.string().min(4).max(8) });

/** Admin: the student reads the emailed code aloud in person; admin types it in here. */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const body = verifyOtpSchema.parse(req.body);
  const app = await PhysicalAssessmentApplication.findById(req.params.id);
  if (!app) throw new ApiError(404, "Application not found");
  if (app.revoked) throw new ApiError(400, "This application has been revoked");
  if (app.status !== "scheduled") throw new ApiError(400, "This application is not awaiting check-in");
  if (!app.qrToken || app.qrToken !== body.token) throw new ApiError(403, "Invalid or expired verification link");

  if ((app.otpAttempts ?? 0) >= MAX_OTP_ATTEMPTS) {
    app.otpHash = null;
    app.otpExpiry = null;
    await app.save();
    throw new ApiError(429, "Too many incorrect codes. Send a new code and try again.");
  }
  if (!isOtpValid(body.otp, app.otpHash ?? undefined, app.otpExpiry ?? undefined)) {
    app.otpAttempts = (app.otpAttempts ?? 0) + 1;
    await app.save();
    throw new ApiError(400, "Invalid or expired code");
  }

  app.otpVerifiedAt = new Date();
  app.otpHash = null;
  app.otpExpiry = null;
  await app.save();

  res.json({ success: true, application: app });
});

const resultSchema = z.object({ passed: z.boolean() });

/** Admin: record the outcome of the in-person assessment once identity is confirmed. */
export const recordResult = asyncHandler(async (req: Request, res: Response) => {
  const body = resultSchema.parse(req.body);
  const app = await PhysicalAssessmentApplication.findById(req.params.id);
  if (!app) throw new ApiError(404, "Application not found");
  if (app.revoked) throw new ApiError(400, "This application has been revoked");
  if (app.status !== "scheduled") throw new ApiError(400, "This application is not awaiting a result");
  if (!app.otpVerifiedAt) throw new ApiError(400, "Verify the student's check-in code first");

  app.status = body.passed ? "cert_approved" : "failed";
  // The QR/OTP round is over either way — invalidate it so a stale scan can't reopen live actions.
  app.qrToken = null;
  app.otpHash = null;
  app.otpExpiry = null;
  app.decidedByAdmin = req.auth!.id as never;
  app.decidedAt = new Date();
  await app.save();

  if (body.passed) {
    await creditProgress(app.userId, app.course);
  }

  const label = await courseLabelFor(app);
  const mail = physicalAssessmentResultEmail(app.studentName, label, body.passed);
  sendMailAsync(app.email, mail.subject, mail.html);

  res.json({ success: true, application: app });
});

const revokeSchema = z.object({ revoked: z.boolean() });

/** Admin: manually block (or restore) a student's ability to redo — fully reversible. */
export const setRevoked = asyncHandler(async (req: Request, res: Response) => {
  const body = revokeSchema.parse(req.body);
  const app = await PhysicalAssessmentApplication.findById(req.params.id);
  if (!app) throw new ApiError(404, "Application not found");
  if (body.revoked && app.status === "cert_approved") {
    throw new ApiError(400, "This application has already been certified");
  }
  app.revoked = body.revoked;
  await app.save();
  res.json({ success: true, application: app });
});
