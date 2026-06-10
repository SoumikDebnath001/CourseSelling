import mongoose, { Schema, Document, Types } from "mongoose";

/**
 * READ-ONLY view of the existing app's `users` collection.
 *
 * This model exists ONLY to look users up at login. It must never write.
 * Guarantees that keep the shared DB safe:
 *   - `collection: "users"`  → maps to the existing collection (no pluralisation surprises)
 *   - `autoIndex: false`     → we never build an index on the other app's collection
 *   - `strict: false`        → tolerate the many fields we don't model
 *   - we only ever call find/findOne on it
 *
 * `password` is `select:false` in the source app, so login must `.select("+password")`.
 */
export interface IExistingUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "member" | "coach";
  isActive: boolean;
  isDeleted: boolean;
  isBlocked?: boolean;
}

const existingUserSchema = new Schema<IExistingUser>(
  {
    name: { type: String },
    email: { type: String },
    password: { type: String, select: false },
    role: { type: String },
    isActive: { type: Boolean },
    isDeleted: { type: Boolean },
    isBlocked: { type: Boolean },
  },
  {
    collection: "users",
    autoIndex: false,
    strict: false,
    versionKey: false,
  }
);

export const ExistingUser =
  (mongoose.models.ExistingUser as mongoose.Model<IExistingUser>) ||
  mongoose.model<IExistingUser>("ExistingUser", existingUserSchema);
