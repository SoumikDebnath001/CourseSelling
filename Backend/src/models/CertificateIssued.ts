import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/**
 * The permanent registry of issued certificate ids. One entry is created the
 * moment a student earns a certificate; its `certificateId` (OGR-YEAR-0001
 * style, sequential per year) never changes no matter how many times the
 * student re-downloads the certificate. Shown in the admin panel.
 */
export interface ICertificateIssued extends Document {
  _id: Types.ObjectId;
  /** The immutable serial printed on the certificate, e.g. "OGR-2026-0001". */
  certificateId: string;
  userId: Types.ObjectId;
  /** Snapshots so the admin list renders without cross-collection lookups. */
  studentName?: string;
  studentEmail?: string;
  course: Types.ObjectId;
  courseName: string;
  /** The CertificateRecord this id belongs to (one id per record). */
  certificate: Types.ObjectId;
  level: string;
  label?: string;
  issuedAt: Date;
}

const schema = new Schema<ICertificateIssued>(
  {
    certificateId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    studentName: { type: String },
    studentEmail: { type: String },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    courseName: { type: String, required: true },
    certificate: { type: Schema.Types.ObjectId, ref: "Ca_CertificateRecord", required: true, unique: true },
    level: { type: String, default: "foundation" },
    label: { type: String },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

schema.index({ userId: 1 });
schema.index({ course: 1 });

export const CertificateIssued = ownedModel<ICertificateIssued>(
  "CertificateIssued",
  schema,
  "certificatesIssued"
);
