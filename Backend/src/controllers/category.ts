import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Category } from "../models/Category";
import { Course } from "../models/Course";
import { slugify } from "../utils/slug";

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, icon } = req.body as z.infer<typeof categorySchema>;
  const slug = slugify(name);
  const exists = await Category.findOne({ slug });
  if (exists) throw new ApiError(409, "A category with this name already exists");
  const category = await Category.create({ name, description, icon, slug });
  res.status(201).json({ success: true, category });
});

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  res.json({ success: true, categories });
});

/** Category page: the category + its published courses. */
export const categoryPage = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id).lean();
  if (!category) throw new ApiError(404, "Category not found");
  const courses = await Course.find({ category: category._id, status: "Published" })
    .select("courseName slug thumbnail price tags studentsEnrolledCount")
    .lean();
  res.json({ success: true, category, courses });
});
