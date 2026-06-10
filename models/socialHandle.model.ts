import { Schema, model, Document } from "mongoose";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "twitter"
  | "youtube"
  | "linkedin"
  | "whatsapp";

export interface ISocialHandle extends Document {
  platform: SocialPlatform;
  url: string;
  order: number;
  isActive: boolean;
}

const socialHandleSchema = new Schema<ISocialHandle>(
  {
    platform: {
      type: String,
      enum: ["facebook", "instagram", "twitter", "youtube", "linkedin", "whatsapp"],
      required: true
    },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const SocialHandle = model<ISocialHandle>("SocialHandle", socialHandleSchema);
