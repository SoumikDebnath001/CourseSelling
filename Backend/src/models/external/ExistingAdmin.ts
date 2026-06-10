import mongoose, { Schema, Document, Types } from "mongoose";

/**
 * READ-ONLY view of the existing app's `admins` collection.
 * Same rules as ExistingUser — login lookups only, never writes, never indexes.
 * `password` is `select:false` in the source app, so login must `.select("+password")`.
 */
export interface IExistingAdmin extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  isDeleted: boolean;
}

const existingAdminSchema = new Schema<IExistingAdmin>(
  {
    name: { type: String },
    email: { type: String },
    password: { type: String, select: false },
    isDeleted: { type: Boolean },
  },
  {
    collection: "admins",
    autoIndex: false,
    strict: false,
    versionKey: false,
  }
);

export const ExistingAdmin =
  (mongoose.models.ExistingAdmin as mongoose.Model<IExistingAdmin>) ||
  mongoose.model<IExistingAdmin>("ExistingAdmin", existingAdminSchema);
