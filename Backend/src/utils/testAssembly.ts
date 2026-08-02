import { Types } from "mongoose";
import { IQuestion, ITest } from "../models/Test";
import { IAssignedQuestion } from "../models/TestAttempt";

/** Question shape grading only cares about — both a fixed-mode IQuestion and a
 *  random-mode IAssignedQuestion snapshot can be normalized into this. */
export interface GradableQuestion {
  _id: string;
  type: "single" | "multiple";
  correctOptions: number[];
  points: number;
  negativeMarks?: number;
  negativePerWrongOption?: number;
  explanation?: string;
}

export function normalizeQuestion(q: IQuestion): GradableQuestion {
  const type = q.type ?? "single";
  return {
    _id: String(q._id),
    type,
    correctOptions: type === "single" ? (q.correctOption != null ? [q.correctOption] : []) : q.correctOptions ?? [],
    points: q.points,
    negativeMarks: q.negativeMarks,
    negativePerWrongOption: q.negativePerWrongOption,
    explanation: q.explanation,
  };
}

export function normalizeAssignedQuestion(q: IAssignedQuestion): GradableQuestion {
  return {
    _id: String(q.questionId),
    type: q.type,
    correctOptions: q.correctOptions,
    points: q.points,
    negativeMarks: q.negativeMarks,
    negativePerWrongOption: q.negativePerWrongOption,
    explanation: q.explanation,
  };
}

/** points-value -> how many pool questions have exactly that many points. */
export function computeMarkTiers(pool: IQuestion[]): Record<number, number> {
  const tiers: Record<number, number> = {};
  for (const q of pool) {
    tiers[q.points] = (tiers[q.points] ?? 0) + 1;
  }
  return tiers;
}

/** All ways to pick counts per mark-tier that sum to exactly targetCount questions
 *  and exactly targetMarks total marks, bounded by how many questions of each tier exist. */
export function enumerateCombos(
  tiers: Record<number, number>,
  targetCount: number,
  targetMarks: number
): Record<number, number>[] {
  const values = Object.keys(tiers)
    .map(Number)
    .sort((a, b) => a - b);
  const combos: Record<number, number>[] = [];
  const chosen: Record<number, number> = {};

  function backtrack(idx: number, remainingCount: number, remainingMarks: number) {
    if (idx === values.length) {
      if (remainingCount === 0 && remainingMarks === 0) combos.push({ ...chosen });
      return;
    }
    const v = values[idx];
    const avail = tiers[v];
    const maxByMarks = v > 0 ? Math.floor(remainingMarks / v) : remainingCount;
    const upper = Math.min(avail, remainingCount, maxByMarks);
    for (let c = 0; c <= upper; c++) {
      chosen[v] = c;
      backtrack(idx + 1, remainingCount - c, remainingMarks - c * v);
    }
    delete chosen[v];
  }

  backtrack(0, targetCount, targetMarks);
  return combos;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sampleWithoutReplacement<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, count);
}

/** Randomly draws a valid combo of questions from test.questions (the pool) matching
 *  test.randomConfig, and shuffles question + option presentation order. Throws if no
 *  combo can satisfy the configured target count/marks with the current pool. */
export function assembleRandomAttempt(test: Pick<ITest, "questions" | "randomConfig">): IAssignedQuestion[] {
  const cfg = test.randomConfig;
  if (!cfg) throw new Error("randomConfig is required for assemblyMode 'random'");

  const tiers = computeMarkTiers(test.questions);
  const combos = enumerateCombos(tiers, cfg.targetQuestionCount, cfg.targetTotalMarks);
  if (combos.length === 0) {
    throw new Error("No valid combination of pool questions satisfies the configured question count / total marks");
  }
  const combo = combos[Math.floor(Math.random() * combos.length)];

  const selected: IQuestion[] = [];
  for (const [pointsStr, count] of Object.entries(combo)) {
    const points = Number(pointsStr);
    const tierPool = test.questions.filter((q) => q.points === points);
    selected.push(...sampleWithoutReplacement(tierPool, count));
  }

  const presentationOrder = shuffle(selected);

  return presentationOrder.map((q) => {
    const type = q.type ?? "single";
    const correctOptions = type === "single" ? (q.correctOption != null ? [q.correctOption] : []) : q.correctOptions ?? [];
    return {
      questionId: q._id as Types.ObjectId,
      questionText: q.questionText,
      type,
      options: q.options,
      optionDisplayOrder: shuffle(q.options.map((_, i) => i)),
      correctOptions,
      points: q.points,
      negativeMarks: q.negativeMarks,
      negativePerWrongOption: q.negativePerWrongOption,
      explanation: q.explanation,
    };
  });
}

export interface QuestionGradeResult {
  earned: number; // signed, NOT floored per-question for "single" (test-level floor applies instead)
  total: number;
  correct: boolean;
}

/** Grades one question given the original option indices the student selected. */
export function gradeQuestion(q: GradableQuestion, selectedOptions: number[]): QuestionGradeResult {
  const correctSet = new Set(q.correctOptions);

  if (q.type === "single") {
    if (selectedOptions.length !== 1) return { earned: 0, total: q.points, correct: false };
    const sel = selectedOptions[0];
    if (correctSet.has(sel)) return { earned: q.points, total: q.points, correct: true };
    const penalty = q.negativeMarks ?? 0;
    return { earned: -penalty, total: q.points, correct: false };
  }

  // type === "multiple": proportional credit, floored at 0 per-question.
  const totalCorrect = correctSet.size;
  const correctPicked = selectedOptions.filter((o) => correctSet.has(o)).length;
  const wrongPicked = selectedOptions.filter((o) => !correctSet.has(o)).length;
  const rawCredit = totalCorrect > 0 ? (correctPicked / totalCorrect) * q.points : 0;
  const penalty = wrongPicked * (q.negativePerWrongOption ?? 0);
  const earned = Math.max(0, rawCredit - penalty);
  const allCorrect = correctPicked === totalCorrect && wrongPicked === 0;
  return { earned, total: q.points, correct: allCorrect };
}

export interface AttemptGradeResult {
  scorePct: number;
  passed: boolean;
  review: {
    questionId: string;
    correctOptions: number[];
    selectedOptions: number[];
    correct: boolean;
    pointsEarned: number;
    pointsPossible: number;
    explanation?: string;
  }[];
}

export function gradeAttempt(
  questions: GradableQuestion[],
  answersByQuestionId: Map<string, number[]>,
  passingScorePct: number
): AttemptGradeResult {
  let earnedRaw = 0;
  let total = 0;
  const review: AttemptGradeResult["review"] = [];

  for (const q of questions) {
    const selected = answersByQuestionId.get(q._id) ?? [];
    const g = gradeQuestion(q, selected);
    earnedRaw += g.earned;
    total += g.total;
    review.push({
      questionId: q._id,
      correctOptions: q.correctOptions,
      selectedOptions: selected,
      correct: g.correct,
      pointsEarned: Math.max(0, g.earned), // display only — never show a negative number on a question card
      pointsPossible: g.total,
      explanation: q.explanation,
    });
  }

  const earned = Math.max(0, earnedRaw); // test-level floor — scorePct can never be negative
  const scorePct = total > 0 ? Math.round((earned / total) * 100) : 0;
  const passed = scorePct >= passingScorePct;
  return { scorePct, passed, review };
}
