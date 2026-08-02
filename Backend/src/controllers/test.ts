import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Test } from "../models/Test";
import { TestAttempt } from "../models/TestAttempt";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { CourseProgress } from "../models/CourseProgress";
import { canAccessCourseContent } from "../utils/access";
import { creditProgress } from "../utils/progression";
import { sendMailAsync } from "../mail/mailSender";
import { testResultEmail, coursePassedEmail } from "../mail/templates";
import {
  assembleRandomAttempt,
  computeMarkTiers,
  enumerateCombos,
  gradeAttempt,
  normalizeAssignedQuestion,
  normalizeQuestion,
} from "../utils/testAssembly";

const questionSchema = z
  .object({
    questionText: z.string().min(1),
    type: z.enum(["single", "multiple"]).default("single"),
    options: z.array(z.string().min(1)).min(2),
    correctOption: z.number().int().min(0).optional(),
    correctOptions: z.array(z.number().int().min(0)).optional(),
    points: z.number().int().min(1).default(1),
    negativeMarks: z.number().min(0).optional(),
    negativePerWrongOption: z.number().min(0).optional(),
    explanation: z.string().optional(),
  })
  .superRefine((q, ctx) => {
    if (q.type === "single" && q.correctOption == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "correctOption is required for a single-choice question", path: ["correctOption"] });
    }
    if (q.type === "multiple" && (!q.correctOptions || q.correctOptions.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "correctOptions is required for a multiple-choice question", path: ["correctOptions"] });
    }
  });

const randomConfigSchema = z.object({
  targetQuestionCount: z.number().int().min(1),
  targetTotalMarks: z.number().int().min(1),
});

export const upsertTestSchema = z
  .object({
    title: z.string().min(2),
    description: z.string().optional(),
    scope: z.enum(["module", "course", "section"]),
    courseId: z.string().min(1),
    moduleId: z.string().optional(),
    /** Required when scope is "section": the section's level key. */
    section: z.string().optional(),
    assemblyMode: z.enum(["fixed", "random"]).default("fixed"),
    randomConfig: randomConfigSchema.optional(),
    questions: z.array(questionSchema).default([]),
    passingScorePct: z.number().min(0).max(100).default(60),
    timeLimitMins: z.number().int().positive().optional(),
    isPublished: z.boolean().default(false),
  })
  .superRefine((body, ctx) => {
    if (body.assemblyMode === "random" && !body.randomConfig) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "randomConfig is required for assemblyMode 'random'", path: ["randomConfig"] });
    }
  });

type QuestionInput = z.infer<typeof questionSchema>;

/** Range-checks correctOption/correctOptions against options.length, type-aware. */
function validateQuestionRange(q: QuestionInput) {
  if (q.type === "single") {
    if (q.correctOption == null || q.correctOption < 0 || q.correctOption >= q.options.length) {
      throw new ApiError(400, "correctOption out of range");
    }
  } else {
    if (!q.correctOptions || q.correctOptions.length === 0) {
      throw new ApiError(400, "correctOptions is required for a multiple-choice question");
    }
    for (const idx of q.correctOptions) {
      if (idx < 0 || idx >= q.options.length) throw new ApiError(400, "correctOptions out of range");
    }
  }
}

/** Throws if assemblyMode is "random" but no combo of the given questions can satisfy randomConfig. */
function validateRandomAssembly(
  assemblyMode: "fixed" | "random",
  randomConfig: { targetQuestionCount: number; targetTotalMarks: number } | undefined,
  questions: { points: number }[]
) {
  if (assemblyMode !== "random") return;
  if (!randomConfig) throw new ApiError(400, "randomConfig is required for assemblyMode 'random'");
  const tiers = computeMarkTiers(questions as { points: number }[] as any);
  const combos = enumerateCombos(tiers, randomConfig.targetQuestionCount, randomConfig.targetTotalMarks);
  if (combos.length === 0) {
    throw new ApiError(
      400,
      "No combination of the current questions can satisfy the configured question count / total marks — add more questions or adjust the targets"
    );
  }
}

/** Admin: create a module test or a final course test. */
export const createTest = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof upsertTestSchema>;
  const course = await Course.findById(body.courseId);
  if (!course) throw new ApiError(404, "Course not found");

  body.questions.forEach(validateQuestionRange);
  validateRandomAssembly(body.assemblyMode, body.randomConfig, body.questions);

  if (body.scope === "section") {
    if (!body.section) throw new ApiError(400, "A section is required for a section test");
    if (!course.sections.some((s) => s.levelKey === body.section)) {
      throw new ApiError(400, "Unknown section for this course");
    }
  }

  const test = await Test.create({
    title: body.title,
    description: body.description,
    scope: body.scope,
    course: course._id,
    module: body.scope === "module" ? body.moduleId : null,
    section: body.scope === "section" ? body.section : null,
    assemblyMode: body.assemblyMode,
    randomConfig: body.randomConfig,
    questions: body.questions,
    passingScorePct: body.passingScorePct,
    timeLimitMins: body.timeLimitMins,
    isPublished: body.isPublished,
  });

  // Link the test to its owner (module.test, course.finalTest, or a section's finalTest).
  if (body.scope === "module" && body.moduleId) {
    await Module.updateOne({ _id: body.moduleId }, { $set: { test: test._id } });
  } else if (body.scope === "course") {
    await Course.updateOne({ _id: course._id }, { $set: { finalTest: test._id } });
  } else if (body.scope === "section" && body.section) {
    await Course.updateOne(
      { _id: course._id, "sections.levelKey": body.section },
      { $set: { "sections.$.finalTest": test._id } }
    );
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
  if (body.assemblyMode !== undefined) test.assemblyMode = body.assemblyMode;
  if (body.randomConfig !== undefined) test.randomConfig = body.randomConfig;
  if (body.questions !== undefined) {
    body.questions.forEach(validateQuestionRange);
    test.questions = body.questions as any;
  }

  validateRandomAssembly(test.assemblyMode ?? "fixed", test.randomConfig, test.questions);

  await test.save();
  res.json({ success: true, test });
});

/** Admin: full test (with answers) for editing. */
export const getTestAdmin = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id).lean();
  if (!test) throw new ApiError(404, "Test not found");
  res.json({ success: true, test });
});

/** Student: get a test to take — WITHOUT correct answers. Options are returned tagged with
 *  their originalIndex; the client must always echo originalIndex values back on submit,
 *  never their display position (random mode shuffles both question and option order). */
export const getTestForTaking = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id).lean();
  if (!test || !test.isPublished) throw new ApiError(404, "Test not available");

  const allowed = await canAccessCourseContent(req.auth, test.course);
  if (!allowed) throw new ApiError(403, "Enrol in this course to take the test");

  const base = {
    _id: test._id,
    title: test.title,
    description: test.description,
    scope: test.scope,
    course: test.course,
    module: test.module,
    passingScorePct: test.passingScorePct,
    timeLimitMins: test.timeLimitMins,
    assemblyMode: test.assemblyMode ?? "fixed",
  };

  if ((test.assemblyMode ?? "fixed") === "fixed") {
    res.json({
      success: true,
      test: {
        ...base,
        questions: test.questions.map((q) => ({
          _id: q._id,
          type: q.type ?? "single",
          questionText: q.questionText,
          options: q.options.map((text, i) => ({ text, originalIndex: i })),
          points: q.points,
        })),
      },
    });
    return;
  }

  // Random mode: reuse an in-progress attempt (no reshuffle on refresh), or assemble a fresh one.
  let attempt = await TestAttempt.findOne({ test: test._id, userId: req.auth!.id, status: "in_progress" });
  if (!attempt) {
    let assignedQuestions;
    try {
      assignedQuestions = assembleRandomAttempt(test);
    } catch (err) {
      throw new ApiError(409, err instanceof Error ? err.message : "Unable to assemble this test");
    }
    attempt = await TestAttempt.create({
      test: test._id,
      userId: req.auth!.id,
      course: test.course,
      status: "in_progress",
      assignedQuestions,
      answers: [],
      startedAt: new Date(),
    });
  }

  res.json({
    success: true,
    test: {
      ...base,
      attemptId: attempt._id,
      questions: attempt.assignedQuestions!.map((q) => ({
        _id: q.questionId,
        type: q.type,
        questionText: q.questionText,
        options: q.optionDisplayOrder.map((origIdx) => ({ text: q.options[origIdx], originalIndex: origIdx })),
        points: q.points,
      })),
    },
  });
});

/** Student: submit answers → graded server-side. */
export const submitTest = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id);
  if (!test || !test.isPublished) throw new ApiError(404, "Test not available");

  const allowed = await canAccessCourseContent(req.auth, test.course);
  if (!allowed) throw new ApiError(403, "Enrol in this course to take the test");

  const rawAnswers = (req.body.answers as { questionId: string; selectedOptions: number[] }[]) ?? [];
  const answersByQuestionId = new Map<string, number[]>(
    rawAnswers.map((a) => [String(a.questionId), a.selectedOptions ?? []])
  );

  const mode = test.assemblyMode ?? "fixed";
  let gradeResult;

  if (mode === "fixed") {
    const questions = test.questions.map(normalizeQuestion);
    gradeResult = gradeAttempt(questions, answersByQuestionId, test.passingScorePct);
    await TestAttempt.create({
      test: test._id,
      userId: req.auth!.id,
      course: test.course,
      status: "submitted",
      answers: rawAnswers.map((a) => ({ questionId: a.questionId, selectedOptions: a.selectedOptions })),
      scorePct: gradeResult.scorePct,
      passed: gradeResult.passed,
      submittedAt: new Date(),
    });
  } else {
    const attemptId = req.body.attemptId as string | undefined;
    if (!attemptId) throw new ApiError(400, "attemptId is required for this test");
    const existing = await TestAttempt.findOne({
      _id: attemptId,
      test: test._id,
      userId: req.auth!.id,
      status: "in_progress",
    });
    if (!existing || !existing.assignedQuestions) {
      throw new ApiError(409, "No in-progress attempt found — refresh the test and try again");
    }

    const questions = existing.assignedQuestions.map(normalizeAssignedQuestion);
    gradeResult = gradeAttempt(questions, answersByQuestionId, test.passingScorePct);

    existing.answers = rawAnswers.map((a) => ({ questionId: a.questionId as any, selectedOptions: a.selectedOptions }));
    existing.scorePct = gradeResult.scorePct;
    existing.passed = gradeResult.passed;
    existing.status = "submitted";
    existing.submittedAt = new Date();
    await existing.save();
  }

  if (gradeResult.passed) {
    await CourseProgress.updateOne(
      { userId: req.auth!.id, course: test.course },
      { $addToSet: { passedTests: test._id } },
      { upsert: true }
    );
    // Passing a module/final test may complete the module or course → credit points.
    await creditProgress(req.auth!.id, test.course);
  }

  // Emails: result always, plus a course-completed note when the FINAL test is passed.
  const result = testResultEmail(req.auth!.name, test.title, gradeResult.scorePct, gradeResult.passed);
  sendMailAsync(req.auth!.email, result.subject, result.html);
  if (gradeResult.passed && test.scope === "course") {
    const course = await Course.findById(test.course).select("courseName").lean();
    if (course) {
      const done = coursePassedEmail(req.auth!.name, course.courseName);
      sendMailAsync(req.auth!.email, done.subject, done.html);
    }
  }

  res.json({
    success: true,
    scorePct: gradeResult.scorePct,
    passed: gradeResult.passed,
    passingScorePct: test.passingScorePct,
    review: gradeResult.review,
  });
});

/** Student: my latest SUBMITTED attempt for a test (never an abandoned in-progress draw). */
export const getMyAttempt = asyncHandler(async (req: Request, res: Response) => {
  const attempt = await TestAttempt.findOne({ test: req.params.id, userId: req.auth!.id, status: { $ne: "in_progress" } })
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
  } else if (test.scope === "section" && test.section) {
    await Course.updateOne(
      { _id: test.course, "sections.levelKey": test.section },
      { $set: { "sections.$.finalTest": null } }
    );
  }
  await TestAttempt.deleteMany({ test: test._id });
  await test.deleteOne();
  res.json({ success: true, message: "Test deleted" });
});
