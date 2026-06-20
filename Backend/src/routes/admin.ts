import { Router } from "express";
import {
  dashboard,
  listStudents,
  getStudentProgression,
  setStudentLevel,
  adjustStudentPoints,
  grantStudentCourse,
  revokeStudentCourse,
  analytics,
} from "../controllers/admin";
import {
  listApplications,
  approveForTest,
  approveForCertificate,
} from "../controllers/physicalAssessment";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/dashboard", requireAuth, requireAdmin, dashboard);
router.get("/analytics", requireAuth, requireAdmin, analytics);
router.get("/students", requireAuth, requireAdmin, listStudents);
router.get("/students/:userId/progression", requireAuth, requireAdmin, getStudentProgression);
router.patch("/students/:userId/level", requireAuth, requireAdmin, setStudentLevel);
router.patch("/students/:userId/points", requireAuth, requireAdmin, adjustStudentPoints);
router.post("/students/:userId/grant", requireAuth, requireAdmin, grantStudentCourse);
router.delete("/students/:userId/grant/:courseId", requireAuth, requireAdmin, revokeStudentCourse);

// Physical-assessment applications
router.get("/physical-assessments", requireAuth, requireAdmin, listApplications);
router.patch("/physical-assessments/:id/approve-test", requireAuth, requireAdmin, approveForTest);
router.patch("/physical-assessments/:id/approve-certificate", requireAuth, requireAdmin, approveForCertificate);

export default router;
