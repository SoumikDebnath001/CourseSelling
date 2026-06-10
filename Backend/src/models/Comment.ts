import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface IComment extends Document {
  _id: Types.ObjectId;
  topic: Types.ObjectId;
  course: Types.ObjectId;
  /** ObjectId in either `users` or `admins` depending on authorModel. */
  authorId: Types.ObjectId;
  authorModel: "User" | "Admin";
  authorNameSnapshot: string;
  text: string;
  parent?: Types.ObjectId | null;
  likes: Types.ObjectId[];
  isPinned: boolean;
  isStarred: boolean;
  isEdited: boolean;
}

const commentSchema = new Schema<IComment>(
  {
    topic: { type: Schema.Types.ObjectId, ref: "Ca_Topic", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    authorId: { type: Schema.Types.ObjectId, required: true }, // existing users._id or admins._id
    authorModel: { type: String, enum: ["User", "Admin"], required: true },
    authorNameSnapshot: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    parent: { type: Schema.Types.ObjectId, ref: "Ca_Comment", default: null },
    likes: [{ type: Schema.Types.ObjectId }], // existing users._id
    isPinned: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Comment = ownedModel<IComment>("Comment", commentSchema, "comments");
