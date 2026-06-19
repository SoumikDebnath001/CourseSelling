import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/** An audit trail of every progression event — points earned and level-ups. */
export interface IProgressionLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  category?: Types.ObjectId;
  type: "topic" | "module" | "course" | "levelup";
  /** Points awarded by this event (0 for a pure level-up). */
  points: number;
  /** The topic/module/course that triggered it. */
  ref?: Types.ObjectId;
  fromLevel?: string;
  toLevel?: string;
  note?: string;
  createdAt: Date;
}

const schema = new Schema<IProgressionLog>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Ca_Category" },
    type: { type: String, enum: ["topic", "module", "course", "levelup"], required: true },
    points: { type: Number, default: 0 },
    ref: { type: Schema.Types.ObjectId },
    fromLevel: { type: String },
    toLevel: { type: String },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

schema.index({ userId: 1, createdAt: -1 });

export const ProgressionLog = ownedModel<IProgressionLog>(
  "ProgressionLog",
  schema,
  "progressionLogs"
);
