import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/**
 * A student's request to take the offline (physical) assessment that gates a certificate.
 * For a miscellaneous course there is one application per (user, course) at scope "course".
 * For a progressive course there is one per section/level at scope "section". The admin
 * reviews it in stages:
 *   pending → scheduled (date set, QR emailed, day-of OTP check-in) → cert_approved (passed)
 *                                                                   → failed (redo resets to pending)
 * `revoked` is a separate, reversible admin override that blocks a student from redoing —
 * independent of `status` so it can be undone without losing the underlying decision history.
 */
export type PhysicalAssessmentStatus = "pending" | "scheduled" | "cert_approved" | "failed";

export interface IPhysicalAssessmentApplication extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  course: Types.ObjectId;
  scope: "course" | "section";
  /** Level key — the section's level for scope "section", or the course's level for scope "course". */
  level: string;
  /** Snapshot of the applicant's name for the admin list. */
  studentName: string;
  /** Snapshot of the applicant's email (pool-agnostic — works for both user pools) for sending mail. */
  email: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
  status: PhysicalAssessmentStatus;

  /** Set by the admin when scheduling the offline assessment. */
  scheduledDate?: Date | null;
  /** Random token embedded in the emailed QR link; rotated on every (re)schedule. */
  qrToken?: string | null;

  /** Day-of check-in OTP, emailed to the student and read aloud to the admin. */
  otpHash?: string | null;
  otpExpiry?: Date | null;
  otpAttempts: number;
  /** Set once the admin confirms the OTP — gates recording a pass/fail result. */
  otpVerifiedAt?: Date | null;

  /** Admin-toggleable override: blocks student resubmission regardless of status. Reversible. */
  revoked: boolean;

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
    email: { type: String, required: true, trim: true, lowercase: true },
    whatsappCountryCode: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "scheduled", "cert_approved", "failed"],
      default: "pending",
    },

    scheduledDate: { type: Date, default: null },
    qrToken: { type: String, default: null },

    otpHash: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    otpVerifiedAt: { type: Date, default: null },

    revoked: { type: Boolean, default: false },

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
