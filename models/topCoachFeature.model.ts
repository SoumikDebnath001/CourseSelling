import { Schema, model, Document } from "mongoose";

export interface ITopCoachFeature extends Document {
  name: string;
  specialization?: string;
  imageUrl?: string;
  imagePublicId?: string;
  bio?: string;
  nationality?: string;
  age?: number;
  experienceYears?: number;
  jerseyNumber?: number;
  order: number;
  isActive: boolean;
}

const topCoachFeatureSchema = new Schema<ITopCoachFeature>(
  {
    name: { type: String, required: true },
    specialization: { type: String },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    bio: { type: String },
    nationality: { type: String },
    age: { type: Number },
    experienceYears: { type: Number },
    jerseyNumber: { type: Number },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const TopCoachFeature = model<ITopCoachFeature>("TopCoachFeature", topCoachFeatureSchema);
