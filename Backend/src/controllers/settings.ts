import { Request, Response } from "express";
import { z } from "zod";
import type { UploadedFile } from "express-fileupload";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Settings, ISettings } from "../models/Settings";
import { uploadFile, deleteFile, signedAssetUrl } from "../utils/storage";

/** Replace stored intro-video / foundation-image / about-image URLs with fresh presigned ones, in place. */
function signSettingsAssets(s: {
  hero?: { introVideoUrl?: string; introVideoPublicId?: string };
  foundation?: { imageUrl?: string; imagePublicId?: string };
  about?: { images?: { url?: string; publicId?: string }[] };
}): void {
  if (s.hero) s.hero.introVideoUrl = signedAssetUrl(s.hero.introVideoPublicId, s.hero.introVideoUrl);
  if (s.foundation) s.foundation.imageUrl = signedAssetUrl(s.foundation.imagePublicId, s.foundation.imageUrl);
  if (s.about?.images) {
    for (const img of s.about.images) img.url = signedAssetUrl(img.publicId, img.url);
  }
}

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
      imageUrl: urlOrEmpty.optional(),
    })
    .optional(),
  footer: z
    .object({
      about: z.string().trim().optional(),
    })
    .optional(),
  about: z
    .object({
      title: z.string().trim().optional(),
      intro: z.string().trim().optional(),
      body: z.string().trim().optional(),
    })
    .optional(),
  socials: z
    .object({
      whatsapp: urlOrEmpty.optional(),
      instagram: urlOrEmpty.optional(),
      facebook: urlOrEmpty.optional(),
      youtube: urlOrEmpty.optional(),
      twitter: urlOrEmpty.optional(),
      linkedin: urlOrEmpty.optional(),
    })
    .optional(),
  socialOrder: z
    .object({
      whatsapp: z.coerce.number().int().optional(),
      instagram: z.coerce.number().int().optional(),
      facebook: z.coerce.number().int().optional(),
      youtube: z.coerce.number().int().optional(),
      twitter: z.coerce.number().int().optional(),
      linkedin: z.coerce.number().int().optional(),
    })
    .optional(),
  footerLinks: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        items: z
          .array(
            z.object({
              label: z.string().trim().min(1),
              href: z.string().trim().min(1),
            })
          )
          .default([]),
      })
    )
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
  const settings = (await Settings.getSingleton()).toObject();
  signSettingsAssets(settings);
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
    for (const k of ["websiteUrl", "youtubeUrl", "imageUrl"] as const) {
      if (body.foundation[k] !== undefined) settings.foundation[k] = body.foundation[k];
    }
    settings.markModified("foundation");
  }
  if (body.footer) {
    if (body.footer.about !== undefined) settings.footer.about = body.footer.about;
    settings.markModified("footer");
  }
  if (body.about) {
    for (const k of ["title", "intro", "body"] as const) {
      if (body.about[k] !== undefined) settings.about[k] = body.about[k];
    }
    settings.markModified("about");
  }
  if (body.socials) {
    for (const k of ["whatsapp", "instagram", "facebook", "youtube", "twitter", "linkedin"] as const) {
      if (body.socials[k] !== undefined) settings.socials[k] = body.socials[k];
    }
    settings.markModified("socials");
  }
  if (body.socialOrder) {
    for (const k of ["whatsapp", "instagram", "facebook", "youtube", "twitter", "linkedin"] as const) {
      if (body.socialOrder[k] !== undefined) settings.socialOrder[k] = body.socialOrder[k];
    }
    settings.markModified("socialOrder");
  }
  if (body.footerLinks !== undefined) {
    settings.footerLinks = body.footerLinks;
    settings.markModified("footerLinks");
  }
  if (body.watermark) {
    if (body.watermark.enabled !== undefined) settings.watermark.enabled = body.watermark.enabled;
    if (body.watermark.opacity !== undefined) settings.watermark.opacity = body.watermark.opacity;
    settings.markModified("watermark");
  }

  await settings.save();
  const out = settings.toObject();
  signSettingsAssets(out);
  res.json({ success: true, settings: out });
});

/** Admin: upload (and replace) the intro video shown on the home page. */
export const uploadIntroVideo = asyncHandler(async (req: Request, res: Response) => {
  const file = req.files?.video as UploadedFile | undefined;
  if (!file) throw new ApiError(400, "No video file provided");

  const settings = await Settings.getSingleton();
  await deleteFile(settings.hero?.introVideoPublicId);

  const up = await uploadFile(file, "intro");
  settings.hero.introVideoUrl = up.url;
  settings.hero.introVideoPublicId = up.key;
  settings.markModified("hero");
  await settings.save();

  const out = settings.toObject();
  signSettingsAssets(out);
  res.json({ success: true, settings: out });
});

/** Admin: upload (and replace) the foundation image shown on the home page. */
export const uploadFoundationImage = asyncHandler(async (req: Request, res: Response) => {
  const file = req.files?.image as UploadedFile | undefined;
  if (!file) throw new ApiError(400, "No image file provided");

  const settings = await Settings.getSingleton();
  await deleteFile(settings.foundation?.imagePublicId);

  const up = await uploadFile(file, "foundation");
  settings.foundation.imageUrl = up.url;
  settings.foundation.imagePublicId = up.key;
  settings.markModified("foundation");
  await settings.save();

  const out = settings.toObject();
  signSettingsAssets(out);
  res.json({ success: true, settings: out });
});

/** Admin: upload and append an image shown on the public About page. */
export const uploadAboutImage = asyncHandler(async (req: Request, res: Response) => {
  const file = req.files?.image as UploadedFile | undefined;
  if (!file) throw new ApiError(400, "No image file provided");

  const settings = await Settings.getSingleton();
  const up = await uploadFile(file, "about");
  if (!settings.about) settings.about = { images: [] } as ISettings["about"];
  settings.about.images.push({ url: up.url, publicId: up.key });
  settings.markModified("about");
  await settings.save();

  const out = settings.toObject();
  signSettingsAssets(out);
  res.json({ success: true, settings: out });
});

/** Admin: remove an About-page image by its storage key (passed as ?publicId=, since keys contain slashes). */
export const removeAboutImage = asyncHandler(async (req: Request, res: Response) => {
  const publicId = String(req.query.publicId || req.body?.publicId || "");
  if (!publicId) throw new ApiError(400, "No image id provided");

  const settings = await Settings.getSingleton();
  await deleteFile(publicId);
  settings.about.images = (settings.about.images ?? []).filter((img) => img.publicId !== publicId);
  settings.markModified("about");
  await settings.save();

  const out = settings.toObject();
  signSettingsAssets(out);
  res.json({ success: true, settings: out });
});
