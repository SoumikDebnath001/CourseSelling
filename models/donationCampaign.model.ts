import { Schema, model, Document } from "mongoose";

export interface IDonationCampaign extends Document {
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  imageUrl?: string;
  imagePublicId?: string;
  isActive: boolean;
  endsAt?: Date;
}

const donationCampaignSchema = new Schema<IDonationCampaign>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    raisedAmount: { type: Number, default: 0 },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    isActive: { type: Boolean, default: true },
    endsAt: { type: Date }
  },
  { timestamps: true }
);

export const DonationCampaign = model<IDonationCampaign>("DonationCampaign", donationCampaignSchema);
