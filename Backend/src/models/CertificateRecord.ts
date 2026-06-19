import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/**
 * A certificate a user has earned by completing a course. One per (user, course). Stores a
 * snapshot of the course/category/level so the dashboard can filter & render certificates
 * even if the course is later edited or removed.
 */
export interface ICertificateRecord extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  course: Types.ObjectId;
  category?: Types.ObjectId;
  /** Level KEY the course sat at when earned. */
  level: string;
  courseName: string;
  categoryName?: string;
  certificateColor: string;
  issuedAt: Date;
}

const schema = new Schema<ICertificateRecord>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Ca_Category" },
    level: { type: String, default: "foundation" },
    courseName: { type: String, required: true },
    categoryName: { type: String },
    certificateColor: { type: String, default: "#4f46e5" },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

schema.index({ userId: 1, course: 1 }, { unique: true });

export const CertificateRecord = ownedModel<ICertificateRecord>(
  "CertificateRecord",
  schema,
  "certificateRecords"
);
