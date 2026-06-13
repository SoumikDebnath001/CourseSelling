import { Router } from "express";
import { getSettings, updateSettings, settingsSchema } from "../controllers/settings";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.get("/", getSettings);
router.put("/", requireAuth, requireAdmin, validateBody(settingsSchema), updateSettings);

export default router;
