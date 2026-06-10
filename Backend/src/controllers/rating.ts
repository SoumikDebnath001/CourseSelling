import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { RatingReview } from "../models/RatingReview";
import { Enrollment } from "../models/Enrollment";

export const ratingSchema = z.object({
  courseId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  review: z.string().min(3).max(1000),
});

/** Student: create/update a review for a course they're enrolled in. */
export const upsertRating = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, rating, review } = req.body as z.infer<typeof ratingSchema>;
  const enrolled = await Enrollment.exists({ userId: req.auth!.id, course: courseId, status: "active" });
  if (!enrolled) throw new ApiError(403, "Only enrolled members can review this course");

  const doc = await RatingReview.findOneAndUpdate(
    { userId: req.auth!.id, course: courseId },
    { rating, review, userNameSnapshot: req.auth!.name },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, rating: doc });
});

/** Public: reviews + average for a course. */
export const courseReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await RatingReview.find({ course: req.params.courseId }).sort({ createdAt: -1 }).lean();
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  res.json({ success: true, reviews, average: Math.round(avg * 10) / 10, count: reviews.length });
});
