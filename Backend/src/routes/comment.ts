import { Router } from "express";
import {
  toggleLike,
  togglePin,
  toggleStar,
  editComment,
  deleteComment,
} from "../controllers/comment";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.post("/:id/like", requireAuth, toggleLike);
router.patch("/:id/pin", requireAuth, requireAdmin, togglePin);
router.patch("/:id/star", requireAuth, requireAdmin, toggleStar);
router.put("/:id", requireAuth, editComment);
router.delete("/:id", requireAuth, deleteComment);

export default router;
