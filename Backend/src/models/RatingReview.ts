import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

export interface IRatingReview extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userNameSnapshot: string;
  course: Types.ObjectId;
  rating: number;
  review: string;
}

const ratingReviewSchema = new Schema<IRatingReview>(
  {
    userId: { type: Schema.Types.ObjectId, required: true }, // existing users._id
    userNameSnapshot: { type: String, required: true },
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

ratingReviewSchema.index({ userId: 1, course: 1 }, { unique: true });

export const RatingReview = ownedModel<IRatingReview>("RatingReview", ratingReviewSchema, "ratings");
