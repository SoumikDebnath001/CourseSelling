import { S3Client } from "@aws-sdk/client-s3";
import { env, isS3Configured } from "./env";

/**
 * Single shared S3 client. Created lazily and only when S3 is configured so the
 * app still boots in development without AWS credentials.
 */
let client: S3Client | null = null;

export function getS3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: env.AWS_REGION!,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export function logS3Status(): void {
  if (isS3Configured) {
    console.log(`✅ S3 + CloudFront configured (bucket: ${env.S3_BUCKET}, cdn: ${env.CLOUDFRONT_DOMAIN})`);
  } else {
    console.warn("⚠️  S3/CloudFront not configured — media uploads will be disabled.");
  }
}
