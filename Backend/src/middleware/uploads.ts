import fileUpload from "express-fileupload";

/**
 * Multipart/form-data parser for the admin upload routes ONLY. It is mounted
 * AFTER requireAuth + requireAdmin on each route (never app-wide), so an
 * unauthenticated request can never spool a large body to disk. There is no
 * fileSize limit by design — admins may upload videos/resources of any size;
 * files spool to /tmp and are then streamed to Cloudflare Stream/R2 in chunks.
 * Format allow-lists (utils/storage assertAllowedFile) control WHAT is accepted.
 */
export const uploadParser = fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
});
