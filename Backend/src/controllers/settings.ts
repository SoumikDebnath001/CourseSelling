import { Request, Response } from "express";
import { z } from "zod";
import type { UploadedFile } from "express-fileupload";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Settings, ISettings } from "../models/Settings";
import { uploadFile, deleteFile, signedAssetUrl, assertAllowedFile } from "../utils/storage";

/** Replace stored media URLs (intro video, images, certificate signature) with fresh presigned ones, in place. */
function signSettingsAssets(s: {
  hero?: { introVideoUrl?: string; introVideoPublicId?: string };
  foundation?: { imageUrl?: string; imagePublicId?: string };
  about?: { images?: { url?: string; publicId?: string }[] };
  certificate?: {
    signatureUrl?: string;
    signaturePublicId?: string;
    signatories?: { signatureUrl?: string; signaturePublicId?: string }[];
  };
}): void {
  if (s.hero) s.hero.introVideoUrl = signedAssetUrl(s.hero.introVideoPublicId, s.hero.introVideoUrl);
  if (s.foundation) s.foundation.imageUrl = signedAssetUrl(s.foundation.imagePublicId, s.foundation.imageUrl);
  if (s.about?.images) {
    for (const img of s.about.images) img.url = signedAssetUrl(img.publicId, img.url);
  }
  if (s.certificate) {
    s.certificate.signatureUrl = signedAssetUrl(s.certificate.signaturePublicId, s.certificate.signatureUrl);
    for (const sig of s.certificate.signatories ?? []) {
      sig.signatureUrl = signedAssetUrl(sig.signaturePublicId, sig.signatureUrl);
    }
  }
}

/** Accepts a URL or an empty string (so admins can clear a field). */
const urlOrEmpty = z.string().trim().url().or(z.literal(""));

export const settingsSchema = z.object({
  platformName: z.string().min(2).optional(),
  email: z.string().trim().email().or(z.literal("")).optional(),
  contactPhone: z.string().trim().optional(),
  place: z.string().trim().optional(),
  // NOTE: the home hero is intentionally NOT updatable any more — the "hero" block is
  // absent from this schema, so any hero payload is stripped before it reaches the model.
  // Certificate signatories are managed via the dedicated /settings/signatories routes,
  // so the "certificate" block is absent here too.
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
  terms: z
    .object({
      content: z.string().trim().min(1, "Terms & Conditions cannot be empty").optional(),
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
  if (body.terms) {
    if (body.terms.content !== undefined) settings.terms.content = body.terms.content;
    settings.markModified("terms");
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

/* ── certificate signatories ──
 * The pool of people whose signature can be printed on certificates. Each course
 * selects up to three of them. Fields arrive as multipart form data alongside an
 * optional background-less (transparent) PNG `signature` file, max 10MB.
 */

const signatorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  roleLine1: z.string().trim().max(120).optional(),
  roleLine2: z.string().trim().max(120).optional(),
});

/** Applies an uploaded signature file to a signatory entry (replacing any old file). */
async function applySignatureFile(
  sig: ISettings["certificate"]["signatories"][number],
  file: UploadedFile
): Promise<void> {
  assertAllowedFile(file, "signature", { maxBytes: 10 * 1024 * 1024 });
  await deleteFile(sig.signaturePublicId);
  const up = await uploadFile(file, "certificate");
  sig.signatureUrl = up.url;
  sig.signaturePublicId = up.key;
  sig.signatureName = file.name;
  sig.signatureSize = up.size;
  sig.signatureFormat = up.format;
}

function respondWithSettings(res: Response, settings: ISettings): void {
  const out = settings.toObject();
  signSettingsAssets(out);
  res.json({ success: true, settings: out });
}

/** Admin: add a certificate signatory (name/roles + optional transparent-PNG signature). */
export const addSignatory = asyncHandler(async (req: Request, res: Response) => {
  const body = signatorySchema.parse(req.body);
  const settings = await Settings.getSingleton();

  settings.certificate.signatories.push({ name: body.name, roleLine1: body.roleLine1, roleLine2: body.roleLine2 });
  const sig = settings.certificate.signatories[settings.certificate.signatories.length - 1];

  const file = req.files?.signature as UploadedFile | undefined;
  if (file) await applySignatureFile(sig, file);

  settings.markModified("certificate");
  await settings.save();
  respondWithSettings(res, settings);
});

/** Admin: update a signatory's details and/or replace their signature image. */
export const updateSignatory = asyncHandler(async (req: Request, res: Response) => {
  const body = signatorySchema.partial().parse(req.body);
  const settings = await Settings.getSingleton();
  const sig = settings.certificate.signatories.find((s) => String(s._id) === req.params.id);
  if (!sig) throw new ApiError(404, "Signatory not found");

  if (body.name !== undefined) sig.name = body.name;
  if (body.roleLine1 !== undefined) sig.roleLine1 = body.roleLine1;
  if (body.roleLine2 !== undefined) sig.roleLine2 = body.roleLine2;

  const file = req.files?.signature as UploadedFile | undefined;
  if (file) await applySignatureFile(sig, file);

  settings.markModified("certificate");
  await settings.save();
  respondWithSettings(res, settings);
});

/** Admin: remove a signatory (and their uploaded signature file). At least one must remain. */
export const deleteSignatory = asyncHandler(async (req: Request, res: Response) => {
  const settings = await Settings.getSingleton();
  const sig = settings.certificate.signatories.find((s) => String(s._id) === req.params.id);
  if (!sig) throw new ApiError(404, "Signatory not found");
  if (settings.certificate.signatories.length <= 1) {
    throw new ApiError(400, "At least one signatory is required — add another before deleting this one.");
  }

  await deleteFile(sig.signaturePublicId);
  settings.certificate.signatories = settings.certificate.signatories.filter(
    (s) => String(s._id) !== req.params.id
  );
  settings.markModified("certificate");
  await settings.save();
  respondWithSettings(res, settings);
});

/** Admin: upload (and replace) the foundation image shown on the home page. */
export const uploadFoundationImage = asyncHandler(async (req: Request, res: Response) => {
  const file = req.files?.image as UploadedFile | undefined;
  if (!file) throw new ApiError(400, "No image file provided");
  assertAllowedFile(file, "image");

  const settings = await Settings.getSingleton();
  await deleteFile(settings.foundation?.imagePublicId);

  const up = await uploadFile(file, "foundation");
  settings.foundation.imageUrl = up.url;
  settings.foundation.imagePublicId = up.key;
  settings.foundation.imageName = file.name;
  settings.foundation.imageSize = up.size;
  settings.foundation.imageFormat = up.format;
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
  assertAllowedFile(file, "image");

  const settings = await Settings.getSingleton();
  const up = await uploadFile(file, "about");
  if (!settings.about) settings.about = { images: [] } as ISettings["about"];
  settings.about.images.push({ url: up.url, publicId: up.key, name: file.name, size: up.size, format: up.format });
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
