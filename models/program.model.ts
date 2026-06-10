import { Schema, model, Document, Types } from "mongoose";

export interface IProgramBenefit {
  text: string;
  order: number;
}

export interface IProgram extends Document {
  name: string;
  description: string;
  imageUrl?: string;
  imagePublicId?: string;
  fees?: number;
  duration?: string;
  schedule?: string;
  ageGroup?: string;
  isActive: boolean;
  order: number;
  // Academy ecosystem fields
  coaches: Types.ObjectId[];
  benefits: IProgramBenefit[];
  durationDays: number;
  enrollmentCapacity?: number;
  isEnrollable: boolean;
  // Extended metadata fields
  courseLevel?: "beginner" | "intermediate" | "advanced";
  programCategory?: string;
  totalLearningHours?: number;
  passingScore?: number;
  progressTrackingEnabled?: boolean;
  deliveryMode?: "online" | "offline" | "hybrid";
}

const programSchema = new Schema<IProgram>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    fees: { type: Number, default: 0 },
    duration: { type: String },
    schedule: { type: String },
    ageGroup: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    coaches: [{ type: Schema.Types.ObjectId, ref: "User" }],
    benefits: [
      {
        text: { type: String, required: true },
        order: { type: Number, default: 0 },
      },
    ],
    durationDays: { type: Number, default: 30 },
    enrollmentCapacity: { type: Number },
    isEnrollable: { type: Boolean, default: true },
    courseLevel: { type: String, enum: ["beginner", "intermediate", "advanced"] },
    programCategory: { type: String },
    totalLearningHours: { type: Number },
    passingScore: { type: Number },
    progressTrackingEnabled: { type: Boolean },
    deliveryMode: { type: String, enum: ["online", "offline", "hybrid"] },
  },
  { timestamps: true }
);

programSchema.index({ isActive: 1, order: 1 });
programSchema.index({ coaches: 1 });

export const Program = model<IProgram>("Program", programSchema);
