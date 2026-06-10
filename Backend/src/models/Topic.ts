import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface IResource {
  name: string;
  url: string;
  publicId?: string;
  type: "pdf" | "link" | "file" | "image";
}

export interface ITopic extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  module: Types.ObjectId;
  course: Types.ObjectId;
  videoUrl?: string;
  videoPublicId?: string;
  timeDurationSec?: number;
  resources: IResource[];
  commentCount: number;
}

const resourceSchema = new Schema<IResource>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String },
    type: { type: String, enum: ["pdf", "link", "file", "image"], default: "link" },
  },
  { _id: true }
);

const topicSchema = new Schema<ITopic>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    order: { type: Number, default: 0 },
    module: { type: Schema.Types.ObjectId, ref: "Ca_Module", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    videoUrl: { type: String },
    videoPublicId: { type: String },
    timeDurationSec: { type: Number },
    resources: { type: [resourceSchema], default: [] },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Topic = ownedModel<ITopic>("Topic", topicSchema, "topics");
