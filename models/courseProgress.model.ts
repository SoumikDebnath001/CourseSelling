import { Schema, model, Document, Types } from "mongoose";

export interface ICourseProgress extends Document {
  courseId: Types.ObjectId;
  completedTopics: string[];
}

const courseProgressSchema = new Schema<ICourseProgress>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, unique: true },
    completedTopics: [{ type: String }],
  },
  { timestamps: true }
);

export const CourseProgress = model<ICourseProgress>("CourseProgress", courseProgressSchema);
