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

  // ── AWS S3 + CloudFront (media storage & delivery) ──
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  /** CloudFront distribution domain, e.g. d1234abcd.cloudfront.net (no protocol). */
  CLOUDFRONT_DOMAIN: z.string().optional(),
  /** Optional: enables signed (protected, expiring) video URLs. */
  CLOUDFRONT_KEY_PAIR_ID: z.string().optional(),
  /** PEM private key. Use literal "\n" for newlines in a single-line .env value. */
  CLOUDFRONT_PRIVATE_KEY: z.string().optional(),
  /** How long a signed video URL stays valid (seconds). Default 6 hours. */
  SIGNED_URL_TTL_SEC: z.coerce.number().default(6 * 60 * 60),

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

/** True when uploads + CDN delivery can work (bucket, creds, region, CDN domain set). */
export const isS3Configured = Boolean(
  env.AWS_REGION &&
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY &&
    env.S3_BUCKET &&
    env.CLOUDFRONT_DOMAIN
);

/** True when video URLs can be signed (protected & expiring). Optional upgrade. */
export const isCloudFrontSigningConfigured = Boolean(
  env.CLOUDFRONT_KEY_PAIR_ID && env.CLOUDFRONT_PRIVATE_KEY && env.CLOUDFRONT_DOMAIN
);

export const isMailConfigured = Boolean(env.MAIL_HOST && env.MAIL_USER && env.MAIL_PASS);
