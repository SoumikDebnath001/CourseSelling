import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryConfigured } from "./env";

export function connectCloudinary(): void {
  if (!isCloudinaryConfigured) {
    console.warn("⚠️  Cloudinary not configured — video/resource uploads will be disabled.");
    return;
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  console.log("✅ Cloudinary configured");
}

export { cloudinary };
