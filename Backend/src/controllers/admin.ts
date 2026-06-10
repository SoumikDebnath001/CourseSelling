import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { Course } from "../models/Course";
import { Enrollment } from "../models/Enrollment";
import { Comment } from "../models/Comment";
import { Test } from "../models/Test";
import { ExistingUser } from "../models/external/ExistingUser";

/** Admin: high-level stats for the dashboard (counts only). */
export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [courses, published, enrollments, comments, tests, members] = await Promise.all([
    Course.countDocuments({}),
    Course.countDocuments({ status: "Published" }),
    Enrollment.countDocuments({ status: "active" }),
    Comment.countDocuments({}),
    Test.countDocuments({}),
    ExistingUser.estimatedDocumentCount(),
  ]);

  const topCourses = await Course.find({})
    .select("courseName slug studentsEnrolledCount status")
    .sort({ studentsEnrolledCount: -1 })
    .limit(5)
    .lean();

  res.json({
    success: true,
    stats: { courses, published, enrollments, comments, tests, members },
    topCourses,
  });
});

/**
 * Admin: list members (read-only from existing `users`) with this app's enrollment
 * counts. Never mutates the users collection.
 */
export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search) : "";
  const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];

  const users = await ExistingUser.find(filter).select("name email role isActive").limit(100).lean();

  const withCounts = await Promise.all(
    users.map(async (u) => ({
      ...u,
      enrolledCount: await Enrollment.countDocuments({ userId: u._id, status: "active" }),
    }))
  );
  res.json({ success: true, students: withCounts });
});
