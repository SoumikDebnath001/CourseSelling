import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/asyncHandler";
import { env } from "../config/env";

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : 500;
  const message =
    err instanceof Error ? err.message : "Something went wrong while processing the request";

  if (isApiError) {
    // Intentional, operational responses (incl. 502/503) — log concisely, no stack noise.
    if (status >= 500) console.warn(`⚠️  ${req.method} ${req.originalUrl} → ${status}: ${message}`);
  } else {
    // A genuinely unexpected error — this is the one worth a full trace.
    console.error(`💥 Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(env.NODE_ENV === "development" && !isApiError && err instanceof Error ? { stack: err.stack } : {}),
  });
}
