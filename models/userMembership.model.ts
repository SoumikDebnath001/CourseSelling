import { Schema, model, Document, Types } from "mongoose";

export type UserMembershipStatus = "active" | "expired" | "suspended" | "pending";

export interface IUserMembership extends Document {
  userId: Types.ObjectId;
  planId?: Types.ObjectId;
  planSnapshot: {
    name: string;
    price: number;
    durationDays: number;
    benefits: Array<{ text: string; order: number }>;
    color?: string;
    badge?: string;
  };
  status: UserMembershipStatus;
  startDate: Date;
  endDate: Date;
  assignedBy?: Types.ObjectId;
  notes?: string;
}

const userMembershipSchema = new Schema<IUserMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "MembershipPlan", sparse: true },
    planSnapshot: {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      durationDays: { type: Number, required: true },
      benefits: [
        {
          text: { type: String, required: true },
          order: { type: Number, default: 0 },
        },
      ],
      color: { type: String },
      badge: { type: String },
    },
    status: {
      type: String,
      enum: ["active", "expired", "suspended", "pending"],
      default: "active",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    notes: { type: String },
  },
  { timestamps: true }
);

userMembershipSchema.index({ userId: 1 });
userMembershipSchema.index({ status: 1 });
userMembershipSchema.index({ endDate: 1 });

export const UserMembership = model<IUserMembership>(
  "UserMembership",
  userMembershipSchema
);
