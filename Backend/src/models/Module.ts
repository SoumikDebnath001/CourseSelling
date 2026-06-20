import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface IModule extends Document {
  _id: Types.ObjectId;
  moduleName: string;
  description?: string;
  order: number;
  course: Types.ObjectId;
  /** For progressive courses: the level key of the section this module belongs to. Null otherwise. */
  section?: string | null;
  topics: Types.ObjectId[];
  test?: Types.ObjectId | null;
  /** Points awarded once when this module is completed. */
  points: number;
}

const moduleSchema = new Schema<IModule>(
  {
    moduleName: { type: String, required: true, trim: true },
    description: { type: String },
    order: { type: Number, default: 0 },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    section: { type: String, default: null },
    topics: [{ type: Schema.Types.ObjectId, ref: "Ca_Topic" }],
    test: { type: Schema.Types.ObjectId, ref: "Ca_Test", default: null },
    points: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Module = ownedModel<IModule>("Module", moduleSchema, "modules");
