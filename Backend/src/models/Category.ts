import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = ownedModel<ICategory>("Category", categorySchema, "categories");
