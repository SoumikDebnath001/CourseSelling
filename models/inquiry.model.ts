import { Schema, model, Document, Types } from "mongoose";

export type InquiryType = "contact" | "member_query" | "coach_mail";
export type InquiryStatus = "pending" | "resolved";

export interface IInquiry extends Document {
  type: InquiryType;
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: Types.ObjectId;
  status: InquiryStatus;
  resolvedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
}

const inquirySchema = new Schema<IInquiry>(
  {
    type: { type: String, enum: ["contact", "member_query", "coach_mail"], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
    resolvedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

export const Inquiry = model<IInquiry>("Inquiry", inquirySchema);
