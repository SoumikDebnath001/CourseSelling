import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/**
 * An admin-granted bypass of progression locking for a single (user, course). When present,
 * the user can enrol/open the course regardless of their category level or points.
 */
export interface ICourseAccessGrant extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  course: Types.ObjectId;
  grantedByAdmin: Types.ObjectId;
}

const schema = new Schema<ICourseAccessGrant>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    grantedByAdmin: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

schema.index({ userId: 1, course: 1 }, { unique: true });

export const CourseAccessGrant = ownedModel<ICourseAccessGrant>(
  "CourseAccessGrant",
  schema,
  "courseAccessGrants"
);
