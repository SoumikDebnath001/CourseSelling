import { Router } from "express";
import { submitApplication } from "../controllers/physicalAssessment";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Student: apply for a physical assessment (enrolment-gated inside the controller).
router.post("/", requireAuth, submitApplication);

export default router;
