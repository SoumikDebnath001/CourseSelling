import { randomUUID } from "crypto";
import { readFile, open } from "fs/promises";
import type { UploadedFile } from "express-fileupload";
import {
  r2PutObject,
  r2DeleteObject,
  r2PresignGetUrl,
  r2CreateMultipartUpload,
  r2UploadPart,
  r2CompleteMultipartUpload,
  r2AbortMultipartUpload,
} from "../config/r2";
import { streamUpload, streamUploadTus, streamDelete, streamPlaybackUrl } from "../config/stream";
import { env, isR2Configured, isStreamConfigured } from "../config/env";
import { ApiError } from "./asyncHandler";

const ROOT = "cricket-academy"; // top-level prefix inside the R2 bucket
/** Marks a stored id as a Cloudflare Stream video UID rather than an R2 object key. */
const STREAM_PREFIX = "stream:";

/* ── Format allow-lists ──────────────────────────────────
 * Server-side gate on WHAT can be uploaded (there is intentionally no size cap —
 * large files stream to Stream/R2 chunk-by-chunk). Extensions are an allow-list,
 * never a block-list, so executables / HTML / SVG and anything else that could be
 * abused when served back simply never reaches storage.
 */
export type UploadKind = "video" | "image" | "document" | "signature";

const ALLOWED_EXTS: Record<UploadKind, string[]> = {
  video: ["mp4", "mov", "m4v", "webm", "mkv", "avi", "mpeg", "mpg", "3gp"],
  image: ["png", "jpg", "jpeg", "webp", "gif", "avif"],
  document: [
    "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv", "txt", "rtf",
    "odt", "odp", "ods", "epub", "zip", "png", "jpg", "jpeg", "webp", "gif",
    "mp3", "wav", "mp4", "mov", "webm",
  ],
  signature: ["png"],
};

/** Human-readable summary of a kind's accepted formats (for error messages / UI parity). */
export const ALLOWED_FORMAT_LABEL: Record<UploadKind, string> = {
  video: "MP4, MOV, M4V, WEBM, MKV, AVI, MPEG, 3GP",
  image: "PNG, JPG, JPEG, WEBP, GIF, AVIF",
  document: "PDF, DOC(X), PPT(X), XLS(X), CSV, TXT, RTF, ODT/ODP/ODS, EPUB, ZIP, images, MP3/WAV, MP4/MOV/WEBM",
  signature: "PNG (transparent background)",
};

/** Lowercase extension of a filename, without the dot. */
export function fileExt(name: string): string {
  const m = /\.([A-Za-z0-9]+)$/.exec(name ?? "");
  return (m?.[1] ?? "").toLowerCase();
}

/**
 * Reject files whose format is not allowed for this upload kind. Checks the
 * extension against the allow-list and sanity-checks the declared mime type so a
 * renamed executable can't slip through as e.g. "notes.pdf" with an exe mime.
 */
export function assertAllowedFile(file: UploadedFile, kind: UploadKind, opts: { maxBytes?: number } = {}): void {
  const ext = fileExt(file.name);
  if (!ext || !ALLOWED_EXTS[kind].includes(ext)) {
    throw new ApiError(400, `"${file.name}" is not an accepted ${kind} format. Allowed: ${ALLOWED_FORMAT_LABEL[kind]}.`);
  }
  const mime = (file.mimetype || "").toLowerCase();
  const blockedMime = /(x-msdownload|x-sh|x-executable|javascript|text\/html|image\/svg)/.test(mime);
  if (blockedMime) throw new ApiError(400, `"${file.name}" has a blocked content type.`);
  if (kind === "video" && mime && !mime.startsWith("video/") && !mime.startsWith("application/octet-stream")) {
    throw new ApiError(400, `"${file.name}" does not look like a video file.`);
  }
  if ((kind === "image" || kind === "signature") && mime && !mime.startsWith("image/")) {
    throw new ApiError(400, `"${file.name}" does not look like an image file.`);
  }
  if (kind === "signature" && mime && mime !== "image/png") {
    throw new ApiError(400, "The signature must be a transparent PNG file.");
  }
  if (opts.maxBytes && file.size > opts.maxBytes) {
    throw new ApiError(400, `"${file.name}" is too large — maximum ${Math.round(opts.maxBytes / (1024 * 1024))}MB for this upload.`);
  }
}

export interface UploadResult {
  /** Durable id we store and use for deletes/playback. R2 key, or `stream:<uid>`. */
  key: string;
  /** Playable/public URL for the asset. */
  url: string;
  /** Size in bytes of the uploaded file. */
  size: number;
  /** Lowercase file extension (e.g. "pdf", "mp4"). */
  format: string;
  /** Declared content type. */
  mimeType?: string;
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

/** Stream a big temp file into R2 with a multipart upload (100MB parts, aborted on failure). */
async function r2MultipartFromFile(key: string, filePath: string, size: number, contentType?: string): Promise<void> {
  const PART = 100 * 1024 * 1024;
  const uploadId = await r2CreateMultipartUpload(key, contentType);
  try {
    const fh = await open(filePath, "r");
    const parts: { partNumber: number; etag: string }[] = [];
    try {
      let offset = 0;
      let partNumber = 1;
      while (offset < size) {
        const len = Math.min(PART, size - offset);
        const buf = Buffer.alloc(len);
        await fh.read(buf, 0, len, offset);
        parts.push({ partNumber, etag: await r2UploadPart(key, uploadId, partNumber, buf) });
        offset += len;
        partNumber += 1;
      }
    } finally {
      await fh.close();
    }
    await r2CompleteMultipartUpload(key, uploadId, parts);
  } catch (err) {
    await r2AbortMultipartUpload(key, uploadId);
    throw err;
  }
}

/** Above this size, uploads stream chunk-by-chunk instead of buffering in memory. */
const LARGE_FILE_BYTES = 100 * 1024 * 1024;

/**
 * Upload a file. Videos (subfolder "videos") go to Cloudflare Stream (transcoded + HLS);
 * everything else goes to R2. Files of any size are supported: large ones are streamed
 * from the temp file in chunks (tus for Stream, multipart for R2). Returns the durable
 * id, a usable URL and the file's size/format metadata.
 */
export async function uploadFile(file: UploadedFile, subfolder: string): Promise<UploadResult> {
  const meta = { size: file.size, format: fileExt(file.name), mimeType: file.mimetype || undefined };

  if (subfolder === "videos") {
    if (!isStreamConfigured) {
      throw new ApiError(503, "Video uploads are not configured (set CF_ACCOUNT_ID / CF_STREAM_API_TOKEN / CF_STREAM_CUSTOMER_CODE)");
    }
    // Stream's basic upload endpoint caps at 200MB — bigger files go through tus.
    const uid =
      file.size > LARGE_FILE_BYTES && file.tempFilePath
        ? await streamUploadTus(file.tempFilePath, file.size, file.name)
        : await streamUpload(await fileBytes(file), file.name, file.mimetype || "video/mp4");
    return { key: `${STREAM_PREFIX}${uid}`, url: streamPlaybackUrl(uid), ...meta };
  }

  if (!isR2Configured) {
    throw new ApiError(503, "File uploads are not configured (set R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET)");
  }
  const key = buildKey(subfolder, file.name);
  if (file.size > LARGE_FILE_BYTES && file.tempFilePath) {
    await r2MultipartFromFile(key, file.tempFilePath, file.size, file.mimetype || "application/octet-stream");
  } else {
    await r2PutObject(key, await fileBytes(file), file.mimetype || "application/octet-stream");
  }
  // `url` is a presigned link valid right now (for the immediate admin response). The durable
  // `key` is what we persist — every read re-signs a fresh URL via signedAssetUrl/signCourseAssets.
  return { key, url: r2PresignGetUrl(key), ...meta };
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
export const isR2Key = (key?: string): key is string => !!key && !key.startsWith(STREAM_PREFIX);

/** The Cloudflare Stream uid inside a stored `stream:<uid>` key, or null for R2 keys. */
export const streamUidOf = (key?: string): string | null =>
  key?.startsWith(STREAM_PREFIX) ? key.slice(STREAM_PREFIX.length) : null;

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
