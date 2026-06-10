import { Schema, model, Document } from "mongoose";

export interface IPlanBenefit {
  text: string;
  order: number;
}

export interface IMembershipPlan extends Document {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  benefits: IPlanBenefit[];
  badge?: string;
  color?: string;
  isActive: boolean;
  order: number;
}

const membershipPlanSchema = new Schema<IMembershipPlan>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    benefits: [
      {
        text: { type: String, required: true },
        order: { type: Number, default: 0 },
      },
    ],
    badge: { type: String },
    color: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const MembershipPlan = model<IMembershipPlan>(
  "MembershipPlan",
  membershipPlanSchema
);
