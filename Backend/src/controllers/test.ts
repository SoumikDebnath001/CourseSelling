import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Test } from "../models/Test";
import { TestAttempt } from "../models/TestAttempt";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { CourseProgress } from "../models/CourseProgress";
import { canAccessCourseContent } from "../utils/access";
import { sendMailAsync } from "../mail/mailSender";
import { testResultEmail, coursePassedEmail } from "../mail/templates";

const questionSchema = z.object({
  questionText: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctOption: z.number().int().min(0),
  points: z.number().int().min(1).default(1),
  explanation: z.string().optional(),
});

export const upsertTestSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  scope: z.enum(["module", "course"]),
  courseId: z.string().min(1),
  moduleId: z.string().optional(),
  questions: z.array(questionSchema).default([]),
  passingScorePct: z.number().min(0).max(100).default(60),
  timeLimitMins: z.number().int().positive().optional(),
  isPublished: z.boolean().default(false),
});

/** Admin: create a module test or a final course test. */
export const createTest = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof upsertTestSchema>;
  const course = await Course.findById(body.courseId);
  if (!course) throw new ApiError(404, "Course not found");

  for (const q of body.questions) {
    if (q.correctOption >= q.options.length) throw new ApiError(400, "correctOption out of range");
  }

  const test = await Test.create({
    title: body.title,
    description: body.description,
    scope: body.scope,
    course: course._id,
    module: body.scope === "module" ? body.moduleId : null,
    questions: body.questions,
    passingScorePct: body.passingScorePct,
    timeLimitMins: body.timeLimitMins,
    isPublished: body.isPublished,
  });

  // Link the test to its owner (module.test or course.finalTest).
  if (body.scope === "module" && body.moduleId) {
    await Module.updateOne({ _id: body.moduleId }, { $set: { test: test._id } });
  } else if (body.scope === "course") {
    await Course.updateOne({ _id: course._id }, { $set: { finalTest: test._id } });
  }

  res.status(201).json({ success: true, test });
});

/** Admin: update an existing test. */
export const updateTest = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw new ApiError(404, "Test not found");
  const body = req.body as Partial<z.infer<typeof upsertTestSchema>>;

  if (body.title !== undefined) test.title = body.title;
  if (body.description !== undefined) test.description = body.description;
  if (body.passingScorePct !== undefined) test.passingScorePct = body.passingScorePct;
  if (body.timeLimitMins !== undefined) test.timeLimitMins = body.timeLimitMins;
  if (body.isPublished !== undefined) test.isPublished = body.isPublished;
  if (body.questions !== undefined) {
    for (const q of body.questions) {
      if (q.correctOption >= q.options.length) throw new ApiError(400, "correctOption out of range");
    }
    test.questions = body.questions;
  }
  await test.save();
  res.json({ success: true, test });
});

/** Admin: full test (with answers) for editing. */
export const getTestAdmin = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id).lean();
  if (!test) throw new ApiError(404, "Test not found");
  res.json({ success: true, test });
});

/** Student: get a test to take — WITHOUT correct answers. */
export const getTestForTaking = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id).lean();
  if (!test || !test.isPublished) throw new ApiError(404, "Test not available");

  const allowed = await canAccessCourseContent(req.auth, test.course);
  if (!allowed) throw new ApiError(403, "Enrol in this course to take the test");

  const safe = {
    _id: test._id,
    title: test.title,
    description: test.description,
    scope: test.scope,
    course: test.course,
    module: test.module,
    passingScorePct: test.passingScorePct,
    timeLimitMins: test.timeLimitMins,
    questions: test.questions.map((q) => ({
      questionText: q.questionText,
      options: q.options,
      points: q.points,
    })),
  };
  res.json({ success: true, test: safe });
});

/** Student: submit answers → graded server-side. */
export const submitTest = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id);
  if (!test || !test.isPublished) throw new ApiError(404, "Test not available");

  const allowed = await canAccessCourseContent(req.auth, test.course);
  if (!allowed) throw new ApiError(403, "Enrol in this course to take the test");

  const answers = (req.body.answers as { questionIndex: number; selectedOption: number }[]) ?? [];
  const byIndex = new Map(answers.map((a) => [a.questionIndex, a.selectedOption]));

  let earned = 0;
  let total = 0;
  const review = test.questions.map((q, i) => {
    total += q.points;
    const selected = byIndex.get(i);
    const correct = selected === q.correctOption;
    if (correct) earned += q.points;
    return { questionIndex: i, correctOption: q.correctOption, selectedOption: selected ?? null, correct, explanation: q.explanation };
  });

  const scorePct = total ? Math.round((earned / total) * 100) : 0;
  const passed = scorePct >= test.passingScorePct;

  await TestAttempt.create({
    test: test._id,
    userId: req.auth!.id,
    course: test.course,
    answers,
    scorePct,
    passed,
  });

  if (passed) {
    await CourseProgress.updateOne(
      { userId: req.auth!.id, course: test.course },
      { $addToSet: { passedTests: test._id } },
      { upsert: true }
    );
  }

  // Emails: result always, plus a course-completed note when the FINAL test is passed.
  const result = testResultEmail(req.auth!.name, test.title, scorePct, passed);
  sendMailAsync(req.auth!.email, result.subject, result.html);
  if (passed && test.scope === "course") {
    const course = await Course.findById(test.course).select("courseName").lean();
    if (course) {
      const done = coursePassedEmail(req.auth!.name, course.courseName);
      sendMailAsync(req.auth!.email, done.subject, done.html);
    }
  }

  res.json({ success: true, scorePct, passed, passingScorePct: test.passingScorePct, review });
});

/** Student: my latest attempt for a test. */
export const getMyAttempt = asyncHandler(async (req: Request, res: Response) => {
  const attempt = await TestAttempt.findOne({ test: req.params.id, userId: req.auth!.id })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, attempt });
});

/** Admin: delete a test and unlink it from its owner. */
export const deleteTest = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw new ApiError(404, "Test not found");
  if (test.scope === "module" && test.module) {
    await Module.updateOne({ _id: test.module }, { $set: { test: null } });
  } else if (test.scope === "course") {
    await Course.updateOne({ _id: test.course }, { $set: { finalTest: null } });
  }
  await TestAttempt.deleteMany({ test: test._id });
  await test.deleteOne();
  res.json({ success: true, message: "Test deleted" });
});
