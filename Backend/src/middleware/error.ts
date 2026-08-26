import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/asyncHandler";
import { env } from "../config/env";

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/**
 * Friendly field-name mapping so Zod paths like "courseDescription" read as
 * "Course description" in the user-facing toast.
 */
const FIELD_LABELS: Record<string, string> = {
  courseName: "Course name",
  courseDescription: "Course description",
  whatYouWillLearn: "What you'll learn",
  price: "Price",
  category: "Path / Category",
  certificateColor: "Certificate colour",
  certificateOrientation: "Certificate orientation",
  courseType: "Course type",
  level: "Level",
  maxLevel: "Max level",
  points: "Points",
  name: "Name",
  email: "Email",
  password: "Password",
};

function labelFor(path: (string | number)[]): string {
  const key = path.filter((p) => typeof p === "string").join(".");
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

/** Build a single, human-readable sentence from the first Zod issue. */
function formatZodMessage(err: ZodError): string {
  const issue = err.issues[0];
  if (!issue) return "Validation failed";
  const field = labelFor(issue.path);
  // Already a clear sentence from Zod (e.g. "String must contain at least 10 character(s)")
  // — prefix with the field name for context.
  return field ? `${field}: ${issue.message}` : issue.message;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // ── Zod validation errors → 400 with a friendly message ──
  if (err instanceof ZodError) {
    res.status(400).json({ success: false, message: formatZodMessage(err) });
    return;
  }

  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : 500;
  const rawMessage =
    err instanceof Error ? err.message : "Something went wrong while processing the request";

  if (isApiError) {
    // Intentional, operational responses (incl. 502/503) — log concisely, no stack noise.
    if (status >= 500) console.warn(`⚠️  ${req.method} ${req.originalUrl} → ${status}: ${rawMessage}`);
  } else {
    // A genuinely unexpected error — this is the one worth a full trace.
    console.error(`💥 Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  }

  // Only return the real message for deliberate ApiErrors. For unexpected errors we
  // return a generic message so internal details (stack, DB, driver strings) never
  // reach the client — except in development, where the full detail aids debugging.
  const isDev = env.NODE_ENV === "development";
  const message = isApiError || isDev ? rawMessage : "Something went wrong while processing the request";

  res.status(status).json({
    success: false,
    message,
    ...(isDev && !isApiError && err instanceof Error ? { stack: err.stack } : {}),
  });
}

