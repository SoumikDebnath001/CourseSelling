import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { Topic } from "../models/Topic";
import { deleteFile } from "../utils/storage";

export const createModuleSchema = z.object({
  courseId: z.string().min(1),
  moduleName: z.string().min(2),
  description: z.string().optional(),
  points: z.coerce.number().int().min(0).optional(),
  /** For progressive courses: the level key of the section this module belongs to. */
  section: z.string().optional(),
});

export const createModule = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, moduleName, description, points, section } = req.body as z.infer<typeof createModuleSchema>;
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  // Progressive courses require the module to be placed in one of the course's sections.
  let sectionKey: string | null = null;
  if (course.courseType === "progressive") {
    if (!section) throw new ApiError(400, "A section is required for progressive courses");
    if (!course.sections.some((s) => s.levelKey === section)) {
      throw new ApiError(400, "Unknown section for this course");
    }
    sectionKey = section;
  }

  const order = course.modules.length;
  const module = await Module.create({
    course: course._id,
    moduleName,
    description,
    order,
    points: points ?? 0,
    section: sectionKey,
  });
  course.modules.push(module._id);
  await course.save();

  res.status(201).json({ success: true, module });
});

export const updateModule = asyncHandler(async (req: Request, res: Response) => {
  const module = await Module.findById(req.params.id);
  if (!module) throw new ApiError(404, "Module not found");
  if (req.body.moduleName !== undefined) module.moduleName = req.body.moduleName;
  if (req.body.description !== undefined) module.description = req.body.description;
  if (req.body.order !== undefined) module.order = Number(req.body.order);
  if (req.body.points !== undefined) module.points = Number(req.body.points);
  await module.save();
  res.json({ success: true, module });
});

export const deleteModule = asyncHandler(async (req: Request, res: Response) => {
  const module = await Module.findById(req.params.id);
  if (!module) throw new ApiError(404, "Module not found");

  const topics = await Topic.find({ module: module._id });
  for (const t of topics) {
    await deleteFile(t.videoPublicId);
    for (const r of t.resources) await deleteFile(r.publicId);
  }
  await Topic.deleteMany({ module: module._id });
  await Course.findByIdAndUpdate(module.course, { $pull: { modules: module._id } });
  await module.deleteOne();

  res.json({ success: true, message: "Module deleted" });
});
