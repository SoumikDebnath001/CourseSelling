import { Router } from "express";
import { upsertRating, ratingSchema } from "../controllers/rating";
import { requireAuth, requireStudent } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.post("/", requireAuth, requireStudent, validateBody(ratingSchema), upsertRating);

export default router;
