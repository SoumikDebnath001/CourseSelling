import { Schema, model, Document, Types } from "mongoose";

export interface ICoachStudent extends Document {
  coachId: Types.ObjectId;
  studentId: Types.ObjectId;
  assignedAt: Date;
  isActive: boolean;
}

const coachStudentSchema = new Schema<ICoachStudent>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

coachStudentSchema.index({ coachId: 1, studentId: 1 }, { unique: true });

export const CoachStudent = model<ICoachStudent>("CoachStudent", coachStudentSchema);
