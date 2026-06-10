import { Schema, model, Document, Types } from 'mongoose';

export type EnrollmentStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended';

export interface IEnrollment extends Document {
  userId: Types.ObjectId;
  programId: Types.ObjectId;
  enrolledAt: Date;
  expiresAt?: Date;
  status: EnrollmentStatus;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  notes?: string;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    enrolledAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled', 'suspended'],
      default: 'active',
    },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    notes: { type: String },
  },
  { timestamps: true }
);

enrollmentSchema.index({ userId: 1 });
enrollmentSchema.index({ programId: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ expiresAt: 1 });
// Compound: one active enrollment per user per program
enrollmentSchema.index(
  { userId: 1, programId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['active', 'pending'] } },
  }
);

export const Enrollment = model<IEnrollment>('Enrollment', enrollmentSchema);
