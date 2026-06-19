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
