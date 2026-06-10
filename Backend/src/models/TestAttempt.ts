import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface IAnswer {
  questionIndex: number;
  selectedOption: number;
}

export interface ITestAttempt extends Document {
  _id: Types.ObjectId;
  test: Types.ObjectId;
  userId: Types.ObjectId;
  course: Types.ObjectId;
  answers: IAnswer[];
  scorePct: number;
  passed: boolean;
  submittedAt: Date;
}

const answerSchema = new Schema<IAnswer>(
  {
    questionIndex: { type: Number, required: true },
    selectedOption: { type: Number, required: true },
  },
  { _id: false }
);

const testAttemptSchema = new Schema<ITestAttempt>(
  {
    test: { type: Schema.Types.ObjectId, ref: "Ca_Test", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true }, // existing users._id
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    answers: { type: [answerSchema], default: [] },
    scorePct: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const TestAttempt = ownedModel<ITestAttempt>("TestAttempt", testAttemptSchema, "testattempts");
