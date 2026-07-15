import { env } from "./env";

/**
 * Cloudflare Stream client (REST API via fetch). Stream ingests an uploaded video,
 * transcodes it and delivers it adaptively over HLS. We store only the returned video
 * UID; playback uses the customer subdomain manifest URL.
 */

const streamBase = (): string => `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/stream`;

interface StreamResult {
  success: boolean;
  result?: { uid: string };
  errors?: unknown;
}

/** Upload a video file's bytes to Stream; returns the new video UID. */
export async function streamUpload(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimetype || "video/mp4" }), filename);

  const res = await fetch(streamBase(), {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_STREAM_API_TOKEN}` },
    body: form,
  });
  const json = (await res.json()) as StreamResult;
  if (!res.ok || !json.result?.uid) {
    throw new Error(`Cloudflare Stream upload failed: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.result.uid;
}

/**
 * Upload a large video to Stream via the tus protocol, streaming it from disk in
 * chunks so files of any size can be ingested without the basic-upload 200MB cap
 * (and without buffering the whole file in memory). Returns the new video UID.
 */
export async function streamUploadTus(filePath: string, size: number, filename: string): Promise<string> {
  const { open } = await import("fs/promises");

  const create = await fetch(streamBase(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CF_STREAM_API_TOKEN}`,
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(size),
      "Upload-Metadata": `name ${Buffer.from(filename).toString("base64")}`,
    },
  });
  if (create.status !== 201) {
    throw new Error(`Cloudflare Stream tus create failed (${create.status}): ${await create.text()}`);
  }
  const uid = create.headers.get("stream-media-id");
  const location = create.headers.get("location");
  if (!uid || !location) throw new Error("Cloudflare Stream tus create: missing upload location");

  // Chunk size must be a multiple of 256KiB (Cloudflare requires 5MB–200MB per chunk).
  const CHUNK = 64 * 1024 * 1024;
  const fh = await open(filePath, "r");
  try {
    let offset = 0;
    while (offset < size) {
      const len = Math.min(CHUNK, size - offset);
      const buf = Buffer.alloc(len);
      await fh.read(buf, 0, len, offset);
      const res = await fetch(location, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${env.CF_STREAM_API_TOKEN}`,
          "Tus-Resumable": "1.0.0",
          "Upload-Offset": String(offset),
          "Content-Type": "application/offset+octet-stream",
        },
        body: buf,
      });
      if (res.status !== 204) {
        throw new Error(`Cloudflare Stream tus chunk failed (${res.status}): ${await res.text()}`);
      }
      offset += len;
    }
  } finally {
    await fh.close();
  }
  return uid;
}

/** Metadata for a Stream video (bytes ingested + duration). Null when unavailable. */
export async function streamDetails(uid: string): Promise<{ size?: number; durationSec?: number } | null> {
  try {
    const res = await fetch(`${streamBase()}/${uid}`, {
      headers: { Authorization: `Bearer ${env.CF_STREAM_API_TOKEN}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: { size?: number; duration?: number } };
    if (!json.result) return null;
    return { size: json.result.size, durationSec: json.result.duration };
  } catch {
    return null;
  }
}

/** Delete a Stream video by UID. Best-effort. */
export async function streamDelete(uid: string): Promise<void> {
  await fetch(`${streamBase()}/${uid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${env.CF_STREAM_API_TOKEN}` },
  });
}

/** HLS playback manifest URL for a video UID. */
export const streamPlaybackUrl = (uid: string): string =>
  `https://customer-${env.CF_STREAM_CUSTOMER_CODE}.cloudflarestream.com/${uid}/manifest/video.m3u8`;
