import { Router } from "express";
import {
  createSponsor,
  listSponsors,
  listAdminSponsors,
  updateSponsor,
  deleteSponsor,
} from "../controllers/sponsor";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { uploadParser } from "../middleware/uploads";

const router = Router();

// Public showcase
router.get("/", listSponsors);

// Admin management
router.get("/admin", requireAuth, requireAdmin, listAdminSponsors);
router.post("/", requireAuth, requireAdmin, uploadParser, createSponsor);
router.put("/:id", requireAuth, requireAdmin, uploadParser, updateSponsor);
router.delete("/:id", requireAuth, requireAdmin, deleteSponsor);

export default router;
