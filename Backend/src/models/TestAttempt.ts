import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface IAnswer {
  /** @deprecated positional index into the legacy fixed-order questions[] — kept only so old docs still read. */
  questionIndex?: number;
  /** @deprecated single selected option — kept only so old docs still read. */
  selectedOption?: number;
  questionId?: Types.ObjectId;
  selectedOptions?: number[];
}

/** Snapshot of a question exactly as shown to the student in a "random" assemblyMode attempt,
 *  captured at assignment time so later pool edits never change grading/review for this attempt. */
export interface IAssignedQuestion {
  questionId: Types.ObjectId;
  questionText: string;
  type: "single" | "multiple";
  options: string[];
  /** Permutation of [0..options.length-1] — the shuffled display order shown to the student. */
  optionDisplayOrder: number[];
  correctOptions: number[];
  points: number;
  negativeMarks?: number;
  negativePerWrongOption?: number;
  explanation?: string;
}

export interface ITestAttempt extends Document {
  _id: Types.ObjectId;
  test: Types.ObjectId;
  userId: Types.ObjectId;
  course: Types.ObjectId;
  status: "in_progress" | "submitted";
  /** Only set for assemblyMode "random" attempts. */
  assignedQuestions?: IAssignedQuestion[];
  answers: IAnswer[];
  scorePct?: number;
  passed?: boolean;
  startedAt?: Date;
  submittedAt?: Date;
}

const answerSchema = new Schema<IAnswer>(
  {
    questionIndex: { type: Number },
    selectedOption: { type: Number },
    questionId: { type: Schema.Types.ObjectId },
    selectedOptions: { type: [Number] },
  },
  { _id: false }
);

const assignedQuestionSchema = new Schema<IAssignedQuestion>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    questionText: { type: String, required: true },
    type: { type: String, enum: ["single", "multiple"], required: true },
    options: { type: [String], required: true },
    optionDisplayOrder: { type: [Number], required: true },
    correctOptions: { type: [Number], required: true },
    points: { type: Number, required: true },
    negativeMarks: { type: Number },
    negativePerWrongOption: { type: Number },
    explanation: { type: String },
  },
  { _id: false }
);

const testAttemptSchema = new Schema<ITestAttempt>(
  {
    test: { type: Schema.Types.ObjectId, ref: "Ca_Test", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true }, // existing users._id
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    status: { type: String, enum: ["in_progress", "submitted"], default: "submitted" },
    assignedQuestions: { type: [assignedQuestionSchema], default: undefined },
    answers: { type: [answerSchema], default: [] },
    scorePct: { type: Number },
    passed: { type: Boolean },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

export const TestAttempt = ownedModel<ITestAttempt>("TestAttempt", testAttemptSchema, "testattempts");
