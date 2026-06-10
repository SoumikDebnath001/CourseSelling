import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/asyncHandler";

/** Validates `req.body` against a Zod schema, replacing it with the parsed value. */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.errors[0];
      throw new ApiError(400, first ? `${first.path.join(".")}: ${first.message}` : "Invalid request body");
    }
    req.body = result.data;
    next();
  };
}
