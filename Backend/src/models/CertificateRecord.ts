import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/**
 * A certificate a user has earned. For miscellaneous courses there is one per (user, course).
 * For progressive courses there is one per completed SECTION/level, so the uniqueness key is
 * (user, course, level). Stores a snapshot of the course/category/level so the dashboard can
 * filter & render certificates even if the course is later edited or removed.
 */
export interface ICertificateRecord extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  course: Types.ObjectId;
  category?: Types.ObjectId;
  /** Level KEY this certificate was earned at (the section's level for progressive courses). */
  level: string;
  /** User-facing level label snapshot (e.g. "Basic"), shown on the certificate. */
  label?: string;
  courseName: string;
  categoryName?: string;
  certificateColor: string;
  /** Layout snapshot ("portrait" | "landscape") the student downloads this certificate in. */
  certificateOrientation?: string;
  /** Permanent certificate id (OGR-YEAR-0001) — copy of the CertificateIssued registry entry. */
  serial?: string;
  issuedAt: Date;
}

const schema = new Schema<ICertificateRecord>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Ca_Category" },
    level: { type: String, default: "foundation" },
    label: { type: String },
    courseName: { type: String, required: true },
    categoryName: { type: String },
    certificateColor: { type: String, default: "#4f46e5" },
    certificateOrientation: { type: String, enum: ["portrait", "landscape"], default: "portrait" },
    serial: { type: String },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

schema.index({ userId: 1, course: 1, level: 1 }, { unique: true });

export const CertificateRecord = ownedModel<ICertificateRecord>(
  "CertificateRecord",
  schema,
  "certificateRecords"
);
