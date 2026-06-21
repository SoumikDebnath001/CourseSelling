import { Router } from "express";
import { createCategory, listCategories, categoryPage, updateCategory, deleteCategory, categorySchema, updateCategorySchema } from "../controllers/category";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.get("/", listCategories);
router.get("/:id/page", categoryPage);
router.post("/", requireAuth, requireAdmin, validateBody(categorySchema), createCategory);
router.put("/:id", requireAuth, requireAdmin, validateBody(updateCategorySchema), updateCategory);
router.delete("/:id", requireAuth, requireAdmin, deleteCategory);

export default router;
