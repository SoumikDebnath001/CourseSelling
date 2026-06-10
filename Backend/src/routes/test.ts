import { Router } from "express";
import {
  createTest,
  updateTest,
  getTestAdmin,
  getTestForTaking,
  submitTest,
  getMyAttempt,
  deleteTest,
  upsertTestSchema,
} from "../controllers/test";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

// Admin authoring
router.post("/", requireAuth, requireAdmin, validateBody(upsertTestSchema), createTest);
router.put("/:id", requireAuth, requireAdmin, updateTest);
router.get("/:id/admin", requireAuth, requireAdmin, getTestAdmin);
router.delete("/:id", requireAuth, requireAdmin, deleteTest);

// Student taking
router.get("/:id", requireAuth, getTestForTaking);
router.post("/:id/submit", requireAuth, submitTest);
router.get("/:id/attempt", requireAuth, getMyAttempt);

export default router;
