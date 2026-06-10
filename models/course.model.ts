import { Schema, model, Document, Types } from "mongoose";

export interface ICourseTopic {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  duration?: string;
  order: number;
}

export interface ICourseModule {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  order: number;
  topics: ICourseTopic[];
}

export interface ICourseBenefit {
  text: string;
  order: number;
}

export interface ICourse extends Document {
  name: string;
  description: string;
  imageUrl?: string;
  imagePublicId?: string;
  fees?: number;
  duration?: string;
  schedule?: string;
  durationDays: number;
  enrollmentCapacity?: number;
  order: number;
  isActive: boolean;
  isEnrollable: boolean;
  courseLevel?: "beginner" | "intermediate" | "advanced";
  deliveryMode?: "online" | "offline" | "hybrid";
  totalLearningHours?: number;
  passingScore?: number;
  coaches: Types.ObjectId[];
  benefits: ICourseBenefit[];
  modules: ICourseModule[];
}

const topicSchema = new Schema<ICourseTopic>({
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: String },
  order: { type: Number, default: 0 },
});

const moduleSchema = new Schema<ICourseModule>({
  name: { type: String, required: true },
  description: { type: String },
  order: { type: Number, default: 0 },
  topics: [topicSchema],
});

const courseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    fees: { type: Number, default: 0 },
    duration: { type: String },
    schedule: { type: String },
    durationDays: { type: Number, default: 30 },
    enrollmentCapacity: { type: Number },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isEnrollable: { type: Boolean, default: true },
    courseLevel: { type: String, enum: ["beginner", "intermediate", "advanced"] },
    deliveryMode: { type: String, enum: ["online", "offline", "hybrid"] },
    totalLearningHours: { type: Number },
    passingScore: { type: Number },
    coaches: [{ type: Schema.Types.ObjectId, ref: "User" }],
    benefits: [
      {
        text: { type: String, required: true },
        order: { type: Number, default: 0 },
      },
    ],
    modules: [moduleSchema],
  },
  { timestamps: true }
);

courseSchema.index({ isActive: 1, order: 1 });
courseSchema.index({ coaches: 1 });

export const Course = model<ICourse>("Course", courseSchema);
