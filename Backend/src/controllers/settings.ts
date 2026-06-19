import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { Settings } from "../models/Settings";

/** Accepts a URL or an empty string (so admins can clear a field). */
const urlOrEmpty = z.string().trim().url().or(z.literal(""));

export const settingsSchema = z.object({
  platformName: z.string().min(2).optional(),
  email: z.string().trim().email().or(z.literal("")).optional(),
  contactPhone: z.string().trim().optional(),
  place: z.string().trim().optional(),
  hero: z
    .object({
      badge: z.string().trim().optional(),
      title: z.string().trim().optional(),
      highlight: z.string().trim().optional(),
      subtitle: z.string().trim().optional(),
      videoUrl: urlOrEmpty.optional(),
    })
    .optional(),
  foundation: z
    .object({
      websiteUrl: urlOrEmpty.optional(),
      youtubeUrl: urlOrEmpty.optional(),
    })
    .optional(),
  watermark: z
    .object({
      enabled: z.boolean().optional(),
      opacity: z.number().min(0).max(1).optional(),
    })
    .optional(),
  levels: z
    .array(
      z.object({
        key: z.string().min(1),
        name: z.string().min(1),
        label: z.string().optional(),
        description: z.string().optional(),
        order: z.coerce.number().int().min(0),
        unlockPoints: z.coerce.number().int().min(0),
      })
    )
    .min(1)
    .optional(),
});

/** Public: the current platform settings (creates defaults on first ever call). */
export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await Settings.getSingleton();
  res.json({ success: true, settings });
});

/** Admin: merge-update the singleton settings document. */
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof settingsSchema>;
  const settings = await Settings.getSingleton();

  if (body.platformName !== undefined) settings.platformName = body.platformName;
  if (body.email !== undefined) settings.email = body.email;
  if (body.contactPhone !== undefined) settings.contactPhone = body.contactPhone;
  if (body.place !== undefined) settings.place = body.place;
  if (body.levels !== undefined) {
    settings.levels = body.levels;
    settings.markModified("levels");
  }

  if (body.hero) {
    for (const k of ["badge", "title", "highlight", "subtitle", "videoUrl"] as const) {
      if (body.hero[k] !== undefined) settings.hero[k] = body.hero[k];
    }
    settings.markModified("hero");
  }
  if (body.foundation) {
    for (const k of ["websiteUrl", "youtubeUrl"] as const) {
      if (body.foundation[k] !== undefined) settings.foundation[k] = body.foundation[k];
    }
    settings.markModified("foundation");
  }
  if (body.watermark) {
    if (body.watermark.enabled !== undefined) settings.watermark.enabled = body.watermark.enabled;
    if (body.watermark.opacity !== undefined) settings.watermark.opacity = body.watermark.opacity;
    settings.markModified("watermark");
  }

  await settings.save();
  res.json({ success: true, settings });
});
