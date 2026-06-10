import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface IModule extends Document {
  _id: Types.ObjectId;
  moduleName: string;
  description?: string;
  order: number;
  course: Types.ObjectId;
  topics: Types.ObjectId[];
  test?: Types.ObjectId | null;
}

const moduleSchema = new Schema<IModule>(
  {
    moduleName: { type: String, required: true, trim: true },
    description: { type: String },
    order: { type: Number, default: 0 },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    topics: [{ type: Schema.Types.ObjectId, ref: "Ca_Topic" }],
    test: { type: Schema.Types.ObjectId, ref: "Ca_Test", default: null },
  },
  { timestamps: true }
);

export const Module = ownedModel<IModule>("Module", moduleSchema, "modules");
