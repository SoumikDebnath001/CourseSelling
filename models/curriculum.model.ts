import { Schema, model, Document, Types } from "mongoose";

export interface ICurriculum extends Document {
  coach: Types.ObjectId;
  title: string;
  description: string;
  scheduledAt: Date;
  studentIds: Types.ObjectId[];
  isCompleted: boolean;
}

const curriculumSchema = new Schema<ICurriculum>(
  {
    coach: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isCompleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Curriculum = model<ICurriculum>("Curriculum", curriculumSchema);
