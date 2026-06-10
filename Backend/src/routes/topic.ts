import { Router } from "express";
import { createTopic, updateTopic, deleteTopic } from "../controllers/topic";
import { listComments, addComment, addCommentSchema } from "../controllers/comment";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

// Topic content (admin authors; multipart handled in controller)
router.post("/", requireAuth, requireAdmin, createTopic);
router.put("/:id", requireAuth, requireAdmin, updateTopic);
router.delete("/:id", requireAuth, requireAdmin, deleteTopic);

// Comments under a topic
router.get("/:topicId/comments", optionalAuth, listComments);
router.post("/:topicId/comments", requireAuth, validateBody(addCommentSchema), addComment);

export default router;
