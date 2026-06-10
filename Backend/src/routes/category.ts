import { Router } from "express";
import { createCategory, listCategories, categoryPage, categorySchema } from "../controllers/category";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.get("/", listCategories);
router.get("/:id/page", categoryPage);
router.post("/", requireAuth, requireAdmin, validateBody(categorySchema), createCategory);

export default router;
