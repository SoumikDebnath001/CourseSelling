import { Router } from "express";
import {
  getSettings,
  updateSettings,
  uploadFoundationImage,
  addSignatory,
  updateSignatory,
  deleteSignatory,
  uploadAboutImage,
  removeAboutImage,
  settingsSchema,
} from "../controllers/settings";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { uploadParser } from "../middleware/uploads";

const router = Router();

router.get("/", getSettings);
router.put("/", requireAuth, requireAdmin, validateBody(settingsSchema), updateSettings);
router.post("/foundation-image", requireAuth, requireAdmin, uploadParser, uploadFoundationImage);
// NOTE: the old POST /intro-video endpoint was removed on purpose — the home hero is no
// longer editable from the admin panel (or the API).
// Certificate signatories pool — each course picks which of them sign its certificate.
router.post("/signatories", requireAuth, requireAdmin, uploadParser, addSignatory);
router.put("/signatories/:id", requireAuth, requireAdmin, uploadParser, updateSignatory);
router.delete("/signatories/:id", requireAuth, requireAdmin, deleteSignatory);
router.post("/about-image", requireAuth, requireAdmin, uploadParser, uploadAboutImage);
router.delete("/about-image", requireAuth, requireAdmin, removeAboutImage);

export default router;
