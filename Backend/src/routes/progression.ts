import { Router } from "express";
import { myProgression, myCertificates, listProgressionCategories } from "../controllers/progression";
import { requireAuth, requireStudent } from "../middleware/auth";

const router = Router();

router.get("/me", requireAuth, requireStudent, myProgression);
router.get("/certificates", requireAuth, requireStudent, myCertificates);
router.get("/categories", listProgressionCategories);

export default router;
