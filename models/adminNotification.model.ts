import { Schema, model, Document, Types } from "mongoose";

export type NotificationType = "membership_expiring" | "membership_expired";

export interface IAdminNotification extends Document {
  type: NotificationType;
  userId: Types.ObjectId;
  userName: string;
  userEmail: string;
  message: string;
  isRead: boolean;
}

const adminNotificationSchema = new Schema<IAdminNotification>(
  {
    type: {
      type: String,
      enum: ["membership_expiring", "membership_expired"],
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AdminNotification = model<IAdminNotification>(
  "AdminNotification",
  adminNotificationSchema
);
