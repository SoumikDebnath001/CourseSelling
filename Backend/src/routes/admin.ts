import { Router } from "express";
import {
  dashboard,
  listStudents,
  getStudentProgression,
  setStudentLevel,
  adjustStudentPoints,
  grantStudentCourse,
  revokeStudentCourse,
  updateStudent,
  setStudentStatus,
  deleteStudent,
  analytics,
  listIssuedCertificates,
} from "../controllers/admin";
import {
  listApplications,
  scheduleAssessment,
  getVerifyDetails,
  sendOtp,
  verifyOtp,
  recordResult,
  setRevoked,
} from "../controllers/physicalAssessment";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/dashboard", requireAuth, requireAdmin, dashboard);
router.get("/analytics", requireAuth, requireAdmin, analytics);
router.get("/certificates", requireAuth, requireAdmin, listIssuedCertificates);
router.get("/students", requireAuth, requireAdmin, listStudents);
router.get("/students/:userId/progression", requireAuth, requireAdmin, getStudentProgression);
router.patch("/students/:userId", requireAuth, requireAdmin, updateStudent);
router.patch("/students/:userId/status", requireAuth, requireAdmin, setStudentStatus);
router.delete("/students/:userId", requireAuth, requireAdmin, deleteStudent);
router.patch("/students/:userId/level", requireAuth, requireAdmin, setStudentLevel);
router.patch("/students/:userId/points", requireAuth, requireAdmin, adjustStudentPoints);
router.post("/students/:userId/grant", requireAuth, requireAdmin, grantStudentCourse);
router.delete("/students/:userId/grant/:courseId", requireAuth, requireAdmin, revokeStudentCourse);

// Physical-assessment applications
router.get("/physical-assessments", requireAuth, requireAdmin, listApplications);
router.patch("/physical-assessments/:id/schedule", requireAuth, requireAdmin, scheduleAssessment);
router.get("/physical-assessments/:id/verify", requireAuth, requireAdmin, getVerifyDetails);
router.post("/physical-assessments/:id/send-otp", requireAuth, requireAdmin, sendOtp);
router.post("/physical-assessments/:id/verify-otp", requireAuth, requireAdmin, verifyOtp);
router.patch("/physical-assessments/:id/result", requireAuth, requireAdmin, recordResult);
router.patch("/physical-assessments/:id/revoke", requireAuth, requireAdmin, setRevoked);

export default router;
