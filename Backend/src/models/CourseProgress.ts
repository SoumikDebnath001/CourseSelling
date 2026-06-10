import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface ICourseProgress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  course: Types.ObjectId;
  completedTopics: Types.ObjectId[];
  passedTests: Types.ObjectId[];
}

const courseProgressSchema = new Schema<ICourseProgress>(
  {
    userId: { type: Schema.Types.ObjectId, required: true }, // -> existing users._id
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    completedTopics: [{ type: Schema.Types.ObjectId, ref: "Ca_Topic" }],
    passedTests: [{ type: Schema.Types.ObjectId, ref: "Ca_Test" }],
  },
  { timestamps: true }
);

courseProgressSchema.index({ userId: 1, course: 1 }, { unique: true });

export const CourseProgress = ownedModel<ICourseProgress>(
  "CourseProgress",
  courseProgressSchema,
  "courseprogress"
);
