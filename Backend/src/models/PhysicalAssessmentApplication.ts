import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/**
 * A student's request to take the offline (physical) assessment that gates a certificate.
 * For a miscellaneous course there is one application per (user, course) at scope "course".
 * For a progressive course there is one per section/level at scope "section". The admin
 * reviews it in two stages:
 *   pending → test_approved (eligible to sit the offline test)
 *           → cert_approved (passed → the certificate is unlocked/issued)
 */
export type PhysicalAssessmentStatus = "pending" | "test_approved" | "cert_approved";

export interface IPhysicalAssessmentApplication extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  course: Types.ObjectId;
  scope: "course" | "section";
  /** Level key — the section's level for scope "section", or the course's level for scope "course". */
  level: string;
  /** Snapshot of the applicant's name for the admin list. */
  studentName: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
  status: PhysicalAssessmentStatus;
  decidedByAdmin?: Types.ObjectId | null;
  decidedAt?: Date | null;
}

const schema = new Schema<IPhysicalAssessmentApplication>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    scope: { type: String, enum: ["course", "section"], required: true },
    level: { type: String, default: "foundation" },
    studentName: { type: String, required: true },
    whatsappCountryCode: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "test_approved", "cert_approved"],
      default: "pending",
    },
    decidedByAdmin: { type: Schema.Types.ObjectId, default: null },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One application per user per course per level (section).
schema.index({ userId: 1, course: 1, level: 1 }, { unique: true });

export const PhysicalAssessmentApplication = ownedModel<IPhysicalAssessmentApplication>(
  "PhysicalAssessmentApplication",
  schema,
  "physicalAssessmentApplications"
);
