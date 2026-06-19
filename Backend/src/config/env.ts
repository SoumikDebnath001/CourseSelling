import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Centralised, validated environment access.
 * Runtime-critical vars (Mongo, JWT) are required; integration vars (AWS S3,
 * mail) are optional so the app can boot in development before they're filled in —
 * the features that need them fail loudly at call time instead of at boot.
 */
const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_URL: z.string().default("http://localhost:3000"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // ── Cloudflare R2 (files: thumbnails + resources) ──
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default("courseselling"),
  /** Public base URL for the bucket (r2.dev or custom domain), no trailing slash. */
  R2_PUBLIC_URL: z.string().optional(),

  // ── Cloudflare Stream (course videos: HLS transcode + delivery) ──
  CF_ACCOUNT_ID: z.string().optional(),
  /** API token with the "Stream:Edit" permission. */
  CF_STREAM_API_TOKEN: z.string().optional(),
  /** Customer subdomain code — the "xyz" in customer-xyz.cloudflarestream.com. */
  CF_STREAM_CUSTOMER_CODE: z.string().optional(),

  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("Cricket Academy <no-reply@cricketacademy.com>"),
});

// Accept either MAIL_* (this app's convention) or SMTP_* (the existing app's
// convention) so a shared .env works without duplicating mail credentials.
const mergedEnv = {
  ...process.env,
  MAIL_HOST: process.env.MAIL_HOST ?? process.env.SMTP_HOST,
  MAIL_PORT: process.env.MAIL_PORT ?? process.env.SMTP_PORT,
  MAIL_USER: process.env.MAIL_USER ?? process.env.SMTP_USER,
  MAIL_PASS: process.env.MAIL_PASS ?? process.env.SMTP_PASS,
  MAIL_FROM: process.env.MAIL_FROM ?? process.env.SMTP_FROM,
};

const parsed = schema.safeParse(mergedEnv);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

/** True when R2 file uploads (thumbnails, resources) can work. */
export const isR2Configured = Boolean(
  env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET &&
    env.R2_PUBLIC_URL
);

/** True when Cloudflare Stream video uploads + playback can work. */
export const isStreamConfigured = Boolean(
  env.CF_ACCOUNT_ID && env.CF_STREAM_API_TOKEN && env.CF_STREAM_CUSTOMER_CODE
);

export const isMailConfigured = Boolean(env.MAIL_HOST && env.MAIL_USER && env.MAIL_PASS);
