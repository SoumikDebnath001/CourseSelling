import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import fileUpload from "express-fileupload";

import { env } from "./config/env";
import { connectDB } from "./config/db";
import { connectCloudinary } from "./config/cloudinary";
import { notFound, errorHandler } from "./middleware/error";
import apiRoutes from "./routes";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
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
app.use("/api/v1", apiRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  connectCloudinary();
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
