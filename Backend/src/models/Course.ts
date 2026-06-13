import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface ICourse extends Document {
  _id: Types.ObjectId;
  courseName: string;
  slug: string;
  courseDescription: string;
  whatYouWillLearn?: string;
  thumbnail?: { url: string; publicId: string };
  price: number;
  tags: string[];
  category?: Types.ObjectId;
  /** ObjectId of an existing `admins` document (read-only ref). */
  createdByAdmin: Types.ObjectId;
  createdByName?: string;
  modules: Types.ObjectId[];
  finalTest?: Types.ObjectId | null;
  instructions: string[];
  /** Accent colour used on the completion certificate (hex). */
  certificateColor: string;
  status: "Draft" | "Published";
  studentsEnrolledCount: number;
}

const courseSchema = new Schema<ICourse>(
  {
    courseName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    courseDescription: { type: String, required: true },
    whatYouWillLearn: { type: String },
    thumbnail: { url: String, publicId: String },
    price: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: "Ca_Category" },
    createdByAdmin: { type: Schema.Types.ObjectId, required: true }, // -> existing admins._id
    createdByName: { type: String },
    modules: [{ type: Schema.Types.ObjectId, ref: "Ca_Module" }],
    finalTest: { type: Schema.Types.ObjectId, ref: "Ca_Test", default: null },
    instructions: { type: [String], default: [] },
    certificateColor: { type: String, default: "#4f46e5" },
    status: { type: String, enum: ["Draft", "Published"], default: "Draft" },
    studentsEnrolledCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Course = ownedModel<ICourse>("Course", courseSchema, "courses");
