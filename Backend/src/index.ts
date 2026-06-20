import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import helmet from "helmet";

import { env } from "./config/env";
import { connectDB } from "./config/db";
import { logStorageStatus } from "./utils/storage";
import { notFound, errorHandler } from "./middleware/error";
import { apiLimiter } from "./middleware/rateLimit";
import apiRoutes from "./routes";

const app = express();

// Behind Nginx the real client IP is in X-Forwarded-For. Trust exactly one proxy
// hop so rate limiters key on the true address (and not Nginx's loopback IP).
app.set("trust proxy", 1);

// Secure HTTP response headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.).
// This is a JSON API, so the restrictive defaults are a good fit; CSP is enforced
// at the edge/Next.js layer where the HTML is served.
app.use(helmet());

// Allow the configured client URL plus its www/apex counterpart, so both
// https://courses.example.org and https://www.courses.example.org work.
// CLIENT_URL may also be a comma-separated list of origins.
const allowedOrigins = (() => {
  const set = new Set<string>();
  for (const raw of env.CLIENT_URL.split(",")) {
    const url = raw.trim();
    if (!url) continue;
    set.add(url);
    try {
      const u = new URL(url);
      const host = u.host.startsWith("www.") ? u.host.slice(4) : `www.${u.host}`;
      set.add(`${u.protocol}//${host}`);
    } catch {
      /* non-URL value — keep as-is */
    }
  }
  return [...set];
})();

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header) and any allowlisted origin.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (env.NODE_ENV === "development") app.use(morgan("dev"));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB for course videos
  })
);

// ── Health ───────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
  res.json({ success: true, service: "cricket-academy-courses", time: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────
app.use("/api/v1", apiLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  logStorageStatus();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 API listening on http://localhost:${env.PORT}/api/v1`);
  });

  // Clean, actionable message instead of an unhandled 'error' stack trace.
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\n❌ Port ${env.PORT} is already in use — another server instance is still running.\n` +
          `   Free it and try again:   kill -9 $(lsof -ti:${env.PORT})\n` +
          `   …or set a different PORT in Backend/.env\n`
      );
    } else {
      console.error("❌ Server error:", err.message);
    }
    process.exit(1);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
