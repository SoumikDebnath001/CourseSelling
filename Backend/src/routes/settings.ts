import { Router } from "express";
import { getSettings, updateSettings, uploadFoundationImage, uploadIntroVideo, uploadAboutImage, removeAboutImage, settingsSchema } from "../controllers/settings";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.get("/", getSettings);
router.put("/", requireAuth, requireAdmin, validateBody(settingsSchema), updateSettings);
router.post("/foundation-image", requireAuth, requireAdmin, uploadFoundationImage);
router.post("/intro-video", requireAuth, requireAdmin, uploadIntroVideo);
router.post("/about-image", requireAuth, requireAdmin, uploadAboutImage);
router.delete("/about-image", requireAuth, requireAdmin, removeAboutImage);

export default router;
