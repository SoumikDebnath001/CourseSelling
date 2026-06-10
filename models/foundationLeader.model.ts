import { Schema, model, Document } from "mongoose";

export interface IFoundationLeader extends Document {
  name: string;
  designation: string;
  bio?: string;
  imageUrl?: string;
  imagePublicId?: string;
  nationality?: string;
  email?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  order: number;
  isActive: boolean;
}

const foundationLeaderSchema = new Schema<IFoundationLeader>(
  {
    name: { type: String, required: true },
    designation: { type: String, required: true },
    bio: { type: String },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    nationality: { type: String },
    email: { type: String },
    linkedinUrl: { type: String },
    twitterUrl: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FoundationLeader = model<IFoundationLeader>("FoundationLeader", foundationLeaderSchema);
