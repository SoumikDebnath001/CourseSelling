import { Schema, model, Document, Types } from "mongoose";

export interface ICourseEnrollment extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  enrolledAt: Date;
  status: "active" | "cancelled";
}

const courseEnrollmentSchema = new Schema<ICourseEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "cancelled"], default: "active" },
  },
  { timestamps: true }
);

courseEnrollmentSchema.index({ userId: 1 });
courseEnrollmentSchema.index({ courseId: 1 });
courseEnrollmentSchema.index(
  { userId: 1, courseId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

export const CourseEnrollment = model<ICourseEnrollment>(
  "CourseEnrollment",
  courseEnrollmentSchema
);
