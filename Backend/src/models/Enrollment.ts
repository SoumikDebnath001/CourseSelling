import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  /** ObjectId of an existing `users` document (read-only ref). */
  userId: Types.ObjectId;
  course: Types.ObjectId;
  status: "active" | "cancelled";
  /** Set by the payment seam — "free" today. */
  paymentRef: string;
  amountPaid: number;
  enrolledAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, required: true }, // -> existing users._id
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    status: { type: String, enum: ["active", "cancelled"], default: "active" },
    paymentRef: { type: String, default: "free" },
    amountPaid: { type: Number, default: 0 },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One active enrollment per user per course.
enrollmentSchema.index(
  { userId: 1, course: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

export const Enrollment = ownedModel<IEnrollment>("Enrollment", enrollmentSchema, "enrollments");
