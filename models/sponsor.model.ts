import { Schema, model, Document } from "mongoose";

export interface ISponsor extends Document {
  name: string;
  imageUrl?: string;
  imagePublicId?: string;
  websiteUrl?: string;
  order: number;
  isActive: boolean;
}

const sponsorSchema = new Schema<ISponsor>(
  {
    name: { type: String, required: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    websiteUrl: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Sponsor = model<ISponsor>("Sponsor", sponsorSchema);
