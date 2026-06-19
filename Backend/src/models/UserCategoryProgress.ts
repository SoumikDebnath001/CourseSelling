import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/**
 * Per-user, PER-CATEGORY progression. One doc per (user, category) pair so progress in
 * one category (e.g. Fast Bowling) never affects another (e.g. Batting).
 *
 * Keyed by the auth `userId` (works for academy members and platform signups — the shared
 * `users` collection is read-only, so all progression state lives here).
 *
 * `points` is the CUMULATIVE points the user has earned within this category and drives
 * level unlocks together with completing a prior-level course. The completed* arrays make
 * point crediting idempotent (an item is never counted twice).
 */
export interface IUserCategoryProgress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  category: Types.ObjectId;
  /** Current unlocked level KEY within this category (see Settings.levels). */
  currentLevel: string;
  points: number;
  completedTopics: Types.ObjectId[];
  completedModules: Types.ObjectId[];
  completedCourses: Types.ObjectId[];
  earnedCertificates: Types.ObjectId[];
}

const schema = new Schema<IUserCategoryProgress>(
  {
    userId: { type: Schema.Types.ObjectId, required: true }, // -> users._id or platform user._id
    category: { type: Schema.Types.ObjectId, ref: "Ca_Category", required: true },
    currentLevel: { type: String, default: "foundation" },
    points: { type: Number, default: 0, min: 0 },
    completedTopics: [{ type: Schema.Types.ObjectId, ref: "Ca_Topic" }],
    completedModules: [{ type: Schema.Types.ObjectId, ref: "Ca_Module" }],
    completedCourses: [{ type: Schema.Types.ObjectId, ref: "Ca_Course" }],
    earnedCertificates: [{ type: Schema.Types.ObjectId, ref: "Ca_CertificateRecord" }],
  },
  { timestamps: true }
);

schema.index({ userId: 1, category: 1 }, { unique: true });

export const UserCategoryProgress = ownedModel<IUserCategoryProgress>(
  "UserCategoryProgress",
  schema,
  "userCategoryProgress"
);
