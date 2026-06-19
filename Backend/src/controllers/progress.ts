import { Request, Response } from "express";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Topic } from "../models/Topic";
import { CourseProgress } from "../models/CourseProgress";
import { creditProgress } from "../utils/progression";

/** Student: mark a topic complete (idempotent). */
export const completeTopic = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.id;
  const { courseId } = req.params;
  const { topicId } = req.body as { topicId?: string };
  if (!topicId) throw new ApiError(400, "topicId is required");

  const topic = await Topic.findOne({ _id: topicId, course: courseId });
  if (!topic) throw new ApiError(404, "Topic not found in this course");

  const progress = await CourseProgress.findOneAndUpdate(
    { userId, course: courseId },
    { $addToSet: { completedTopics: topic._id } },
    { upsert: true, new: true }
  ).lean();

  // Credit topic/module/course points to the course's category (idempotent).
  await creditProgress(userId, courseId);

  res.json({ success: true, completedTopics: progress?.completedTopics?.map(String) ?? [] });
});

/** Student: get my progress for a course. */
export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.id;
  const { courseId } = req.params;
  const progress = await CourseProgress.findOne({ userId, course: courseId }).lean();
  const totalTopics = await Topic.countDocuments({ course: courseId });
  const completed = progress?.completedTopics?.length ?? 0;
  res.json({
    success: true,
    completedTopics: progress?.completedTopics?.map(String) ?? [],
    passedTests: progress?.passedTests?.map(String) ?? [],
    totalTopics,
    percent: totalTopics ? Math.round((completed / totalTopics) * 100) : 0,
  });
});
