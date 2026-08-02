import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface IQuestion {
  _id: Types.ObjectId;
  questionText: string;
  /** "single" = one correct option (radio). "multiple" = 1+ correct options (checkboxes), scored proportionally. */
  type: "single" | "multiple";
  options: string[];
  /** Used when type === "single". */
  correctOption?: number;
  /** Used when type === "multiple". */
  correctOptions?: number[];
  points: number;
  /** Flat penalty for a wrong single-choice answer. Optional — no penalty if unset. */
  negativeMarks?: number;
  /** Penalty per incorrectly-selected option on a multiple-choice question. Optional — no penalty if unset. */
  negativePerWrongOption?: number;
  explanation?: string;
}

export interface ITest extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  scope: "module" | "course" | "section";
  course: Types.ObjectId;
  module?: Types.ObjectId | null;
  /** For section-final tests (scope "section"): the section's level key. */
  section?: string | null;
  /** "fixed" = every student sees all questions, in order (default, current behavior).
   *  "random" = questions[] is a pool; each attempt draws a random combo matching randomConfig. */
  assemblyMode: "fixed" | "random";
  randomConfig?: {
    targetQuestionCount: number;
    targetTotalMarks: number;
  };
  questions: IQuestion[];
  passingScorePct: number;
  timeLimitMins?: number;
  isPublished: boolean;
}

const questionSchema = new Schema<IQuestion>(
  {
    questionText: { type: String, required: true },
    type: { type: String, enum: ["single", "multiple"], default: "single" },
    options: {
      type: [String],
      required: true,
      validate: { validator: (v: string[]) => v.length >= 2, message: "At least 2 options" },
    },
    correctOption: { type: Number, min: 0 },
    correctOptions: { type: [Number], default: undefined },
    points: { type: Number, default: 1, min: 1 },
    negativeMarks: { type: Number, min: 0 },
    negativePerWrongOption: { type: Number, min: 0 },
    explanation: { type: String },
  },
  { _id: true }
);

const testSchema = new Schema<ITest>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    scope: { type: String, enum: ["module", "course", "section"], required: true },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    module: { type: Schema.Types.ObjectId, ref: "Ca_Module", default: null },
    section: { type: String, default: null },
    assemblyMode: { type: String, enum: ["fixed", "random"], default: "fixed" },
    randomConfig: {
      type: new Schema(
        {
          targetQuestionCount: { type: Number, min: 1 },
          targetTotalMarks: { type: Number, min: 1 },
        },
        { _id: false }
      ),
      default: undefined,
    },
    questions: { type: [questionSchema], default: [] },
    passingScorePct: { type: Number, default: 60, min: 0, max: 100 },
    timeLimitMins: { type: Number },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Test = ownedModel<ITest>("Test", testSchema, "tests");
