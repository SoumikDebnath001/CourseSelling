import { Types } from "mongoose";
import { Enrollment } from "../models/Enrollment";
import type { AuthPayload } from "../types/auth";

/** True if the auth context may view full course content (enrolled user or any admin). */
export async function canAccessCourseContent(
  auth: AuthPayload | undefined,
  courseId: string | Types.ObjectId
): Promise<boolean> {
  if (!auth) return false;
  if (auth.kind === "admin") return true;
  return !!(await Enrollment.exists({ userId: auth.id, course: courseId, status: "active" }));
}
