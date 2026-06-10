import type { UploadedFile } from "express-fileupload";
import { cloudinary } from "../config/cloudinary";
import { isCloudinaryConfigured } from "../config/env";
import { ApiError } from "./asyncHandler";

const FOLDER_ROOT = "cricket-academy-courses";

export interface UploadResult {
  url: string;
  publicId: string;
  durationSec?: number;
  resourceType: string;
  format?: string;
}

/** Uploads a single express-fileupload file (image / video / raw) to Cloudinary. */
export async function uploadFile(
  file: UploadedFile,
  subfolder: string,
  resourceType: "image" | "video" | "auto" = "auto"
): Promise<UploadResult> {
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, "Media uploads are not configured (set CLOUDINARY_* env vars)");
  }
  const res = await cloudinary.uploader.upload(file.tempFilePath, {
    folder: `${FOLDER_ROOT}/${subfolder}`,
    resource_type: resourceType,
  });
  return {
    url: res.secure_url,
    publicId: res.public_id,
    durationSec: res.duration ? Math.round(res.duration) : undefined,
    resourceType: res.resource_type,
    format: res.format,
  };
}

/** Deletes a Cloudinary asset; swallows errors (cleanup is best-effort). */
export async function destroyFile(publicId?: string, resourceType: "image" | "video" | "raw" = "image"): Promise<void> {
  if (!publicId || !isCloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.warn("Cloudinary destroy failed:", err instanceof Error ? err.message : err);
  }
}
