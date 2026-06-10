import { Router } from "express";
import { dashboard, listStudents } from "../controllers/admin";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/dashboard", requireAuth, requireAdmin, dashboard);
router.get("/students", requireAuth, requireAdmin, listStudents);

export default router;
