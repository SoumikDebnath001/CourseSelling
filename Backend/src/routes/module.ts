import { Router } from "express";
import { createModule, updateModule, deleteModule, createModuleSchema } from "../controllers/module";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.post("/", requireAuth, requireAdmin, validateBody(createModuleSchema), createModule);
router.put("/:id", requireAuth, requireAdmin, updateModule);
router.delete("/:id", requireAuth, requireAdmin, deleteModule);

export default router;
