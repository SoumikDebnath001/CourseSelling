import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getCloudFrontSignedUrl } from "@aws-sdk/cloudfront-signer";
import type { UploadedFile } from "express-fileupload";
import { getS3 } from "../config/s3";
import { env, isS3Configured, isCloudFrontSigningConfigured } from "../config/env";
import { ApiError } from "./asyncHandler";

const ROOT = "cricket-academy"; // top-level prefix inside the bucket

export interface UploadResult {
  /** S3 object key — the durable id we store and use for deletes/signing. */
  key: string;
  /** Public CloudFront URL for the object (unsigned). */
  url: string;
}

/** Builds a collision-proof key like `cricket-academy/videos/ab12…-My-File.mp4`. */
function buildKey(subfolder: string, originalName: string): string {
  const safe = originalName.replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").slice(-80);
  return `${ROOT}/${subfolder}/${randomUUID()}-${safe}`;
}

/** Plain (unsigned) CloudFront URL for a stored key. */
export function cdnUrl(key: string): string {
  return `https://${env.CLOUDFRONT_DOMAIN}/${key}`;
}

/**
 * Signed, expiring CloudFront URL — used for protected course videos so links
 * can't be freely shared. Falls back to the plain CDN URL when signing keys
 * aren't configured yet (so the site works before that optional setup is done).
 */
export function signedVideoUrl(key: string): string {
  if (!isCloudFrontSigningConfigured) return cdnUrl(key);
  const privateKey = env.CLOUDFRONT_PRIVATE_KEY!.replace(/\\n/g, "\n");
  return getCloudFrontSignedUrl({
    url: cdnUrl(key),
    keyPairId: env.CLOUDFRONT_KEY_PAIR_ID!,
    privateKey,
    dateLessThan: new Date(Date.now() + env.SIGNED_URL_TTL_SEC * 1000).toISOString(),
  });
}

/**
 * Uploads a single express-fileupload temp file to S3 (private bucket).
 * Returns the object key + its public CloudFront URL.
 */
export async function uploadFile(file: UploadedFile, subfolder: string): Promise<UploadResult> {
  if (!isS3Configured) {
    throw new ApiError(503, "Media uploads are not configured (set AWS_* / S3_BUCKET / CLOUDFRONT_DOMAIN)");
  }
  const key = buildKey(subfolder, file.name);
  // express-fileupload with useTempFiles writes to disk; stream the bytes up.
  const body = file.tempFilePath ? await readFile(file.tempFilePath) : file.data;

  await getS3().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: key,
      Body: body,
      ContentType: file.mimetype || "application/octet-stream",
    })
  );

  return { key, url: cdnUrl(key) };
}

/** Deletes an object from S3 by key. Best-effort — never throws. */
export async function deleteFile(key?: string): Promise<void> {
  if (!key || !isS3Configured) return;
  try {
    await getS3().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET!, Key: key }));
  } catch (err) {
    console.warn("S3 delete failed:", err instanceof Error ? err.message : err);
  }
}
