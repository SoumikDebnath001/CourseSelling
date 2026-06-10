import { Request, Response } from "express";
import { z } from "zod";
import type { UploadedFile } from "express-fileupload";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { Topic } from "../models/Topic";
import { Enrollment } from "../models/Enrollment";
import { uniqueSlug } from "../utils/slug";
import { uploadFile, destroyFile } from "../utils/cloudinaryUpload";

export const createCourseSchema = z.object({
  courseName: z.string().min(3),
  courseDescription: z.string().min(10),
  whatYouWillLearn: z.string().optional(),
  price: z.coerce.number().min(0).default(0),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  category: z.string().optional(),
  instructions: z.union([z.string(), z.array(z.string())]).optional(),
});

function toArray(v?: string | string[]): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* not JSON */
  }
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Admin: create a Draft course (optional thumbnail upload). */
export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof createCourseSchema>;
  const thumbFile = req.files?.thumbnail as UploadedFile | undefined;

  let thumbnail;
  if (thumbFile) {
    const up = await uploadFile(thumbFile, "thumbnails", "image");
    thumbnail = { url: up.url, publicId: up.publicId };
  }

  const course = await Course.create({
    courseName: body.courseName,
    slug: uniqueSlug(body.courseName),
    courseDescription: body.courseDescription,
    whatYouWillLearn: body.whatYouWillLearn,
    price: body.price ?? 0,
    tags: toArray(body.tags),
    instructions: toArray(body.instructions),
    category: body.category || undefined,
    thumbnail,
    createdByAdmin: req.auth!.id,
    createdByName: req.auth!.name,
    status: "Draft",
  });

  res.status(201).json({ success: true, course });
});

/** Admin: update course fields / replace thumbnail. */
export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, "Course not found");

  const body = req.body as Partial<z.infer<typeof createCourseSchema>>;
  const thumbFile = req.files?.thumbnail as UploadedFile | undefined;

  if (thumbFile) {
    await destroyFile(course.thumbnail?.publicId, "image");
    const up = await uploadFile(thumbFile, "thumbnails", "image");
    course.thumbnail = { url: up.url, publicId: up.publicId };
  }
  if (body.courseName !== undefined) course.courseName = body.courseName;
  if (body.courseDescription !== undefined) course.courseDescription = body.courseDescription;
  if (body.whatYouWillLearn !== undefined) course.whatYouWillLearn = body.whatYouWillLearn;
  if (body.price !== undefined) course.price = Number(body.price);
  if (body.category !== undefined) course.category = (body.category || undefined) as never;
  if (body.tags !== undefined) course.tags = toArray(body.tags);
  if (body.instructions !== undefined) course.instructions = toArray(body.instructions);

  await course.save();
  res.json({ success: true, course });
});

/** Admin: publish / unpublish. Requires at least one module to publish. */
export const setCourseStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = req.body.status === "Published" ? "Published" : "Draft";
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, "Course not found");
  if (status === "Published" && course.modules.length === 0) {
    throw new ApiError(400, "Add at least one module before publishing");
  }
  course.status = status;
  await course.save();
  res.json({ success: true, course });
});

/** Admin: delete course and cascade its modules + topics (+ Cloudinary assets). */
export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, "Course not found");

  const topics = await Topic.find({ course: course._id });
  for (const t of topics) {
    await destroyFile(t.videoPublicId, "video");
    for (const r of t.resources) await destroyFile(r.publicId, "raw");
  }
  await Topic.deleteMany({ course: course._id });
  await Module.deleteMany({ course: course._id });
  await destroyFile(course.thumbnail?.publicId, "image");
  await course.deleteOne();

  res.json({ success: true, message: "Course deleted" });
});

/** Public: published catalog (optional ?category=&search=). */
export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = { status: "Published" };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.courseName = { $regex: String(req.query.search), $options: "i" };

  const courses = await Course.find(filter)
    .select("courseName slug courseDescription thumbnail price tags studentsEnrolledCount createdByName category")
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, courses });
});

/** Public: course landing by slug — structure WITHOUT video URLs (gated). */
export const getCourseBySlug = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ slug: req.params.slug, status: "Published" })
    .populate("category", "name slug")
    .populate({
      path: "modules",
      options: { sort: { order: 1 } },
      populate: {
        path: "topics",
        options: { sort: { order: 1 } },
        select: "title description order timeDurationSec resources commentCount", // NB: no videoUrl
      },
    })
    .lean();
  if (!course) throw new ApiError(404, "Course not found");

  // Strip resource URLs from the public preview, keep counts/titles.
  type LeanTopic = { resources?: unknown[]; videoUrl?: string };
  type LeanModule = { topics?: LeanTopic[] };
  for (const m of (course.modules as unknown as LeanModule[]) ?? []) {
    for (const t of m.topics ?? []) {
      t.resources = (t.resources ?? []).map(() => ({ locked: true }));
    }
  }

  let isEnrolled = false;
  if (req.auth?.kind === "user") {
    isEnrolled = !!(await Enrollment.exists({ userId: req.auth.id, course: course._id, status: "active" }));
  }
  res.json({ success: true, course, isEnrolled });
});

/** Admin: list all courses (any status) for management. */
export const listAdminCourses = asyncHandler(async (_req: Request, res: Response) => {
  const courses = await Course.find({})
    .select("courseName slug status price thumbnail studentsEnrolledCount modules createdAt")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, courses });
});

/** Admin: a single course with full nested content for the builder. */
export const getAdminCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.id)
    .populate("category", "name slug")
    .populate({
      path: "modules",
      options: { sort: { order: 1 } },
      populate: [
        { path: "topics", options: { sort: { order: 1 } } },
        { path: "test", select: "title scope isPublished questions" },
      ],
    })
    .populate("finalTest", "title scope isPublished questions")
    .lean();
  if (!course) throw new ApiError(404, "Course not found");
  res.json({ success: true, course });
});
