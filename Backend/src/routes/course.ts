import { Router } from "express";
import {
  createCourse,
  updateCourse,
  setCourseStatus,
  deleteCourse,
  listCourses,
  getCourseBySlug,
  listAdminCourses,
  getAdminCourse,
  applyCoursePoints,
} from "../controllers/course";
import { courseReviews } from "../controllers/rating";
import { getFullCourse } from "../controllers/enrollment";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth";

const router = Router();

// Public catalog
router.get("/", listCourses);
router.get("/slug/:slug", optionalAuth, getCourseBySlug);
router.get("/:courseId/reviews", courseReviews);

// Admin management
router.get("/admin/all", requireAuth, requireAdmin, listAdminCourses);
router.get("/admin/:id", requireAuth, requireAdmin, getAdminCourse);
router.post("/", requireAuth, requireAdmin, createCourse);
router.put("/:id", requireAuth, requireAdmin, updateCourse);
router.patch("/:id/status", requireAuth, requireAdmin, setCourseStatus);
router.patch("/:id/points", requireAuth, requireAdmin, applyCoursePoints);
router.delete("/:id", requireAuth, requireAdmin, deleteCourse);

// Enrolled full content (student or admin)
router.get("/:courseId/full", requireAuth, getFullCourse);

export default router;
