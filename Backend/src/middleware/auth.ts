import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";
import { ApiError } from "../utils/asyncHandler";

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies?.token) return req.cookies.token as string;
  return null;
}

/** Requires a valid JWT; attaches the decoded payload to `req.auth`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, "Authentication required");
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired session");
  }
}

/** Attaches `req.auth` if a valid token is present, but never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      req.auth = verifyToken(token);
    } catch {
      /* ignore — treat as anonymous */
    }
  }
  next();
}

/** Admin-only routes (course authoring / moderation). */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.kind !== "admin") throw new ApiError(403, "Admin access required");
  next();
}

/** Student-only routes (course consumption). */
export function requireStudent(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.kind !== "user") throw new ApiError(403, "This action is for academy members");
  next();
}
