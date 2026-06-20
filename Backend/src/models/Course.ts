import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export type CourseType = "progressive" | "miscellaneous";

/**
 * One auto-generated section of a progressive course. There is exactly one section per
 * level in the course's `level → maxLevel` range (e.g. Basic / Intermediate / Advanced).
 * Sections are seeded from the level config and are not freely editable by admins — they
 * only fill modules, set a section-final test, and toggle the physical-assessment gate.
 */
export interface ICourseSection {
  /** Level key this section maps to (see Settings.levels). */
  levelKey: string;
  order: number;
  /** When true, a passed offline physical assessment is required for this section's certificate. */
  requiresPhysicalAssessment: boolean;
  /** Optional section-final test (Test with scope "section"). */
  finalTest?: Types.ObjectId | null;
}

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
  /**
   * "progressive" = part of a structured Foundation→Level1→Level2 path within a category.
   * "miscellaneous" = standalone course unlocked by reaching a level in its category.
   */
  courseType: CourseType;
  /** Level key (see Settings.levels) this course sits at, e.g. "foundation". */
  level: string;
  /** For progressive courses: the highest level key this path culminates in. */
  maxLevel?: string;
  /** Points awarded once when a user fully completes this course. */
  points: number;
  /**
   * For non-sectioned (miscellaneous) courses: when true the single certificate is gated
   * behind a passed offline physical assessment. (Progressive courses use the per-section
   * flag on `sections` instead.)
   */
  requiresPhysicalAssessment: boolean;
  /** Auto-seeded sections (progressive courses only). Empty for miscellaneous courses. */
  sections: ICourseSection[];
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
    courseType: { type: String, enum: ["progressive", "miscellaneous"], default: "progressive" },
    level: { type: String, default: "foundation" },
    maxLevel: { type: String },
    points: { type: Number, default: 0, min: 0 },
    requiresPhysicalAssessment: { type: Boolean, default: false },
    sections: {
      type: [
        new Schema<ICourseSection>(
          {
            levelKey: { type: String, required: true },
            order: { type: Number, default: 0 },
            requiresPhysicalAssessment: { type: Boolean, default: false },
            finalTest: { type: Schema.Types.ObjectId, ref: "Ca_Test", default: null },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    status: { type: String, enum: ["Draft", "Published"], default: "Draft" },
    studentsEnrolledCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Course = ownedModel<ICourse>("Course", courseSchema, "courses");
