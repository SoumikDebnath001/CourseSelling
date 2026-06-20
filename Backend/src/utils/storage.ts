import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import type { UploadedFile } from "express-fileupload";
import { r2PutObject, r2DeleteObject, r2PresignGetUrl } from "../config/r2";
import { streamUpload, streamDelete, streamPlaybackUrl } from "../config/stream";
import { env, isR2Configured, isStreamConfigured } from "../config/env";
import { ApiError } from "./asyncHandler";

const ROOT = "cricket-academy"; // top-level prefix inside the R2 bucket
/** Marks a stored id as a Cloudflare Stream video UID rather than an R2 object key. */
const STREAM_PREFIX = "stream:";

export interface UploadResult {
  /** Durable id we store and use for deletes/playback. R2 key, or `stream:<uid>`. */
  key: string;
  /** Playable/public URL for the asset. */
  url: string;
}

/** Builds a collision-proof R2 key like `cricket-academy/thumbnails/ab12…-My-File.png`. */
function buildKey(subfolder: string, originalName: string): string {
  const safe = originalName.replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").slice(-80);
  return `${ROOT}/${subfolder}/${randomUUID()}-${safe}`;
}

async function fileBytes(file: UploadedFile): Promise<Buffer> {
  // express-fileupload with useTempFiles writes to disk; otherwise bytes are in memory.
  return file.tempFilePath ? await readFile(file.tempFilePath) : file.data;
}

/**
 * Upload a file. Videos (subfolder "videos") go to Cloudflare Stream (transcoded + HLS);
 * everything else goes to R2. Returns the durable id + a usable URL.
 */
export async function uploadFile(file: UploadedFile, subfolder: string): Promise<UploadResult> {
  const body = await fileBytes(file);

  if (subfolder === "videos") {
    if (!isStreamConfigured) {
      throw new ApiError(503, "Video uploads are not configured (set CF_ACCOUNT_ID / CF_STREAM_API_TOKEN / CF_STREAM_CUSTOMER_CODE)");
    }
    const uid = await streamUpload(body, file.name, file.mimetype || "video/mp4");
    return { key: `${STREAM_PREFIX}${uid}`, url: streamPlaybackUrl(uid) };
  }

  if (!isR2Configured) {
    throw new ApiError(503, "File uploads are not configured (set R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET)");
  }
  const key = buildKey(subfolder, file.name);
  await r2PutObject(key, body, file.mimetype || "application/octet-stream");
  // `url` is a presigned link valid right now (for the immediate admin response). The durable
  // `key` is what we persist — every read re-signs a fresh URL via signedAssetUrl/signCourseAssets.
  return { key, url: r2PresignGetUrl(key) };
}

/** Delete a stored asset by its key (R2 object or Stream video). Best-effort — never throws. */
export async function deleteFile(key?: string): Promise<void> {
  if (!key) return;
  try {
    if (key.startsWith(STREAM_PREFIX)) {
      if (isStreamConfigured) await streamDelete(key.slice(STREAM_PREFIX.length));
    } else if (isR2Configured) {
      await r2DeleteObject(key);
    }
  } catch (err) {
    console.warn("Media delete failed:", err instanceof Error ? err.message : err);
  }
}

/** Resolve a stored id to a playable URL (Stream HLS manifest, or a presigned R2 GET URL). */
export function signedVideoUrl(key: string): string {
  if (key.startsWith(STREAM_PREFIX)) return streamPlaybackUrl(key.slice(STREAM_PREFIX.length));
  return r2PresignGetUrl(key);
}

/** True when `key` is an R2 object key (not a Cloudflare Stream uid). */
const isR2Key = (key?: string): key is string => !!key && !key.startsWith(STREAM_PREFIX);

/**
 * Re-sign a stored asset key into a fresh short-lived URL for the response. Returns `fallback`
 * (the stored url) untouched for non-R2 assets — Stream uids, legacy CDN links, external URLs —
 * or when R2 isn't configured. Call this at READ time, never persist the result.
 */
export function signedAssetUrl(key?: string, fallback?: string): string | undefined {
  if (isR2Configured && isR2Key(key)) return r2PresignGetUrl(key);
  return fallback;
}

type Thumb = { url?: string; publicId?: string } | null | undefined;
type Resource = { url?: string; publicId?: string };
type AssetTopic = { videoUrl?: string; videoPublicId?: string; resources?: Resource[] };
type AssetCourse = { thumbnail?: Thumb; modules?: { topics?: AssetTopic[] }[] } | null | undefined;

/** Re-sign a course's thumbnail in place (lean object or a Mongoose doc's toObject()). */
export function signThumbnail(course: { thumbnail?: Thumb } | null | undefined): void {
  const t = course?.thumbnail;
  if (t?.publicId && isR2Key(t.publicId) && isR2Configured) t.url = r2PresignGetUrl(t.publicId);
}

/**
 * Re-sign every R2-backed asset inside a populated course in place: thumbnail, and (for each
 * topic) its file resources and — when `opts.videos` — its video. Stream videos and external
 * links pass through unchanged.
 */
export function signCourseAssets(course: AssetCourse, opts: { videos?: boolean } = {}): void {
  if (!course) return;
  signThumbnail(course);
  for (const m of course.modules ?? []) {
    for (const t of m.topics ?? []) {
      if (opts.videos && t.videoPublicId) t.videoUrl = signedVideoUrl(t.videoPublicId);
      for (const r of t.resources ?? []) {
        if (isR2Key(r.publicId) && isR2Configured) r.url = r2PresignGetUrl(r.publicId);
      }
    }
  }
}

/** Boot-time log of which storage integrations are wired up. */
export function logStorageStatus(): void {
  if (isR2Configured) console.log(`✅ Cloudflare R2 configured (bucket: ${env.R2_BUCKET})`);
  else console.warn("⚠️  R2 not configured — file uploads (thumbnails/resources) disabled.");
  if (isStreamConfigured) console.log("✅ Cloudflare Stream configured (course videos).");
  else console.warn("⚠️  Cloudflare Stream not configured — video uploads disabled.");
}
