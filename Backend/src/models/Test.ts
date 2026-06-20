import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface IQuestion {
  questionText: string;
  options: string[];
  correctOption: number;
  points: number;
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
  questions: IQuestion[];
  passingScorePct: number;
  timeLimitMins?: number;
  isPublished: boolean;
}

const questionSchema = new Schema<IQuestion>(
  {
    questionText: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: { validator: (v: string[]) => v.length >= 2, message: "At least 2 options" },
    },
    correctOption: { type: Number, required: true, min: 0 },
    points: { type: Number, default: 1, min: 1 },
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
    questions: { type: [questionSchema], default: [] },
    passingScorePct: { type: Number, default: 60, min: 0, max: 100 },
    timeLimitMins: { type: Number },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Test = ownedModel<ITest>("Test", testSchema, "tests");
