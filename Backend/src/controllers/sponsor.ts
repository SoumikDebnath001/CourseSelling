import { Request, Response } from "express";
import { z } from "zod";
import type { UploadedFile } from "express-fileupload";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Sponsor } from "../models/Sponsor";
import { uploadFile, deleteFile, assertAllowedFile } from "../utils/storage";

const formBoolean = z.preprocess(
  (v) => (v === undefined ? undefined : v === true || v === "true" || v === "1"),
  z.boolean()
);

export const sponsorSchema = z.object({
  name: z.string().min(2),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  order: z.coerce.number().int().default(0),
  isActive: formBoolean.default(true),
});

export const updateSponsorSchema = sponsorSchema.partial();

export const createSponsor = asyncHandler(async (req: Request, res: Response) => {
  const body = sponsorSchema.parse(req.body);
  const imageFile = req.files?.image as UploadedFile | undefined;

  let imageUrl;
  if (imageFile) {
    assertAllowedFile(imageFile, "image");
    const up = await uploadFile(imageFile, "sponsors");
    imageUrl = { url: up.url, publicId: up.key, size: up.size, format: up.format };
  }

  const sponsor = await Sponsor.create({
    name: body.name,
    websiteUrl: body.websiteUrl || undefined,
    order: body.order,
    isActive: body.isActive,
    imageUrl,
  });

  res.status(201).json({ success: true, sponsor });
});

export const listSponsors = asyncHandler(async (req: Request, res: Response) => {
  // Public users might hit this with req.auth undefined (if not protected route).
  // We'll return active and non-deleted sponsors.
  // Admins might want to see all. We can differentiate or just return all non-deleted for now.
  // Let's check if admin based on route or just return all non-deleted for admin, and active for public.
  // We'll create listAdminSponsors and listPublicSponsors to be safe.
  const sponsors = await Sponsor.find({ isActive: true, isDeleted: false })
    .sort({ order: 1, createdAt: -1 })
    .lean();
  res.json({ success: true, sponsors });
});

export const listAdminSponsors = asyncHandler(async (_req: Request, res: Response) => {
  const sponsors = await Sponsor.find({ isDeleted: false })
    .sort({ order: 1, createdAt: -1 })
    .lean();
  res.json({ success: true, sponsors });
});

export const updateSponsor = asyncHandler(async (req: Request, res: Response) => {
  const sponsor = await Sponsor.findById(req.params.id);
  if (!sponsor || sponsor.isDeleted) throw new ApiError(404, "Sponsor not found");

  const body = updateSponsorSchema.parse(req.body);
  const imageFile = req.files?.image as UploadedFile | undefined;

  if (imageFile) {
    assertAllowedFile(imageFile, "image");
    if (sponsor.imageUrl?.publicId) {
      await deleteFile(sponsor.imageUrl.publicId);
    }
    const up = await uploadFile(imageFile, "sponsors");
    sponsor.imageUrl = { url: up.url, publicId: up.key, size: up.size, format: up.format };
  }

  if (body.name !== undefined) sponsor.name = body.name;
  if (body.websiteUrl !== undefined) sponsor.websiteUrl = body.websiteUrl || undefined;
  if (body.order !== undefined) sponsor.order = body.order;
  if (body.isActive !== undefined) sponsor.isActive = body.isActive;

  await sponsor.save();
  res.json({ success: true, sponsor });
});

export const deleteSponsor = asyncHandler(async (req: Request, res: Response) => {
  const sponsor = await Sponsor.findById(req.params.id);
  if (!sponsor || sponsor.isDeleted) throw new ApiError(404, "Sponsor not found");

  // Hard delete image from R2, soft delete from DB
  if (sponsor.imageUrl?.publicId) {
    await deleteFile(sponsor.imageUrl.publicId);
    sponsor.imageUrl = undefined; // clear out after deletion
  }
  
  sponsor.isDeleted = true;
  await sponsor.save();

  res.json({ success: true, message: "Sponsor deleted" });
});
