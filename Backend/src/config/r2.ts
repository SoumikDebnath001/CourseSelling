import { createHash, createHmac } from "crypto";
import { env } from "./env";

/**
 * Minimal Cloudflare R2 client. R2 speaks the S3 API, so we sign requests with AWS
 * SigV4 — but using only Node's crypto + global fetch (no AWS SDK). Used for durable
 * file storage (thumbnails, resources). Videos go to Cloudflare Stream instead.
 */

const REGION = "auto";
const SERVICE = "s3";

const sha256Hex = (data: string | Buffer): string => createHash("sha256").update(data).digest("hex");
const hmac = (key: Buffer | string, data: string): Buffer => createHmac("sha256", key).update(data).digest();

function amzDate(d: Date): { amzdate: string; datestamp: string } {
  const amzdate = d.toISOString().replace(/[:-]|\.\d{3}/g, ""); // YYYYMMDDTHHMMSSZ
  return { amzdate, datestamp: amzdate.slice(0, 8) };
}

function signingKey(secret: string, datestamp: string): Buffer {
  const kDate = hmac("AWS4" + secret, datestamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, "aws4_request");
}

const r2Host = (): string => `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

/** URI-encode each path segment (AWS leaves "/" between segments unencoded). */
const encodeKey = (key: string): string => key.split("/").map(encodeURIComponent).join("/");

async function signedRequest(
  method: "PUT" | "DELETE",
  key: string,
  body: Buffer,
  contentType?: string
): Promise<Response> {
  const host = r2Host();
  const canonicalUri = `/${env.R2_BUCKET}/${encodeKey(key)}`;
  const { amzdate, datestamp } = amzDate(new Date());
  const payloadHash = sha256Hex(body);

  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzdate,
  };
  if (contentType) headers["content-type"] = contentType;

  const signedKeys = Object.keys(headers).sort();
  const canonicalHeaders = signedKeys.map((k) => `${k}:${headers[k]}\n`).join("");
  const signedHeaders = signedKeys.join(";");
  const canonicalRequest = [method, canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const scope = `${datestamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzdate, scope, sha256Hex(canonicalRequest)].join("\n");
  const signature = hmac(signingKey(env.R2_SECRET_ACCESS_KEY!, datestamp), stringToSign).toString("hex");
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(`https://${host}${canonicalUri}`, {
    method,
    headers: { ...headers, Authorization: authorization },
    body: method === "PUT" ? body : undefined,
  });
}

export async function r2PutObject(key: string, body: Buffer, contentType?: string): Promise<void> {
  const res = await signedRequest("PUT", key, body, contentType);
  if (!res.ok) throw new Error(`R2 put failed (${res.status}): ${await res.text()}`);
}

export async function r2DeleteObject(key: string): Promise<void> {
  const res = await signedRequest("DELETE", key, Buffer.alloc(0));
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete failed (${res.status}): ${await res.text()}`);
  }
}

/**
 * Presigned GET URL for a PRIVATE object — SigV4 query-string signing. The bucket stays
 * private; the browser fetches the object directly from R2 using this short-lived, signed
 * link (default 6h). Range requests still work (host is the only signed header), so video
 * seeking is unaffected. Must be regenerated on every read — never stored, since it expires.
 */
export function r2PresignGetUrl(key: string, expiresSeconds = 6 * 3600): string {
  const host = r2Host();
  const canonicalUri = `/${env.R2_BUCKET}/${encodeKey(key)}`;
  const { amzdate, datestamp } = amzDate(new Date());
  const scope = `${datestamp}/${REGION}/${SERVICE}/aws4_request`;

  // Signature-bearing query params (X-Amz-Signature itself is appended after signing).
  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${env.R2_ACCESS_KEY_ID}/${scope}`,
    "X-Amz-Date": amzdate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");

  const canonicalRequest = ["GET", canonicalUri, canonicalQuery, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzdate, scope, sha256Hex(canonicalRequest)].join("\n");
  const signature = hmac(signingKey(env.R2_SECRET_ACCESS_KEY!, datestamp), stringToSign).toString("hex");

  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
