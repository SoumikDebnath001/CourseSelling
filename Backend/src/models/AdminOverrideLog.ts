import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/** Audit log for every manual admin override of a user's progression. */
export interface IAdminOverrideLog extends Document {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  adminName?: string;
  userId: Types.ObjectId;
  action: "set-level" | "adjust-points" | "grant-access";
  category?: Types.ObjectId;
  fromLevel?: string;
  toLevel?: string;
  pointsDelta?: number;
  course?: Types.ObjectId;
  note?: string;
  createdAt: Date;
}

const schema = new Schema<IAdminOverrideLog>(
  {
    adminId: { type: Schema.Types.ObjectId, required: true },
    adminName: { type: String },
    userId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, enum: ["set-level", "adjust-points", "grant-access"], required: true },
    category: { type: Schema.Types.ObjectId, ref: "Ca_Category" },
    fromLevel: { type: String },
    toLevel: { type: String },
    pointsDelta: { type: Number },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course" },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

schema.index({ userId: 1, createdAt: -1 });

export const AdminOverrideLog = ownedModel<IAdminOverrideLog>(
  "AdminOverrideLog",
  schema,
  "adminOverrideLogs"
);
