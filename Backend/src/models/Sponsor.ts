import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface ISponsor extends Document {
  _id: Types.ObjectId;
  name: string;
  imageUrl?: { url: string; publicId: string; size?: number; format?: string };
  websiteUrl?: string;
  order: number;
  isActive: boolean;
  isDeleted: boolean;
}

const sponsorSchema = new Schema<ISponsor>(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { url: String, publicId: String, size: Number, format: String },
    websiteUrl: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Sponsor = ownedModel<ISponsor>("Sponsor", sponsorSchema, "Course_Selling_Sponsers");
