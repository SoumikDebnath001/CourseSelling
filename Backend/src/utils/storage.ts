import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import type { UploadedFile } from "express-fileupload";
import { r2PutObject, r2DeleteObject, r2PublicUrl } from "../config/r2";
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
    throw new ApiError(503, "File uploads are not configured (set R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_URL)");
  }
  const key = buildKey(subfolder, file.name);
  await r2PutObject(key, body, file.mimetype || "application/octet-stream");
  return { key, url: r2PublicUrl(key) };
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

/** Resolve a stored id to a playable URL (Stream HLS manifest, or R2 public URL). */
export function signedVideoUrl(key: string): string {
  if (key.startsWith(STREAM_PREFIX)) return streamPlaybackUrl(key.slice(STREAM_PREFIX.length));
  return r2PublicUrl(key);
}

/** Boot-time log of which storage integrations are wired up. */
export function logStorageStatus(): void {
  if (isR2Configured) console.log(`✅ Cloudflare R2 configured (bucket: ${env.R2_BUCKET})`);
  else console.warn("⚠️  R2 not configured — file uploads (thumbnails/resources) disabled.");
  if (isStreamConfigured) console.log("✅ Cloudflare Stream configured (course videos).");
  else console.warn("⚠️  Cloudflare Stream not configured — video uploads disabled.");
}
