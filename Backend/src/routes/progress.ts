import { Router } from "express";
import { completeTopic, getProgress } from "../controllers/progress";
import { requireAuth, requireStudent } from "../middleware/auth";

const router = Router();

router.get("/:courseId", requireAuth, requireStudent, getProgress);
router.post("/:courseId/complete-topic", requireAuth, requireStudent, completeTopic);

export default router;
