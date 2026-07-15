import { Router } from "express";
import { createTopic, updateTopic, deleteTopic } from "../controllers/topic";
import { listComments, addComment, addCommentSchema } from "../controllers/comment";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { uploadParser } from "../middleware/uploads";

const router = Router();

// Topic content (admin authors; multipart parsed AFTER the auth checks)
router.post("/", requireAuth, requireAdmin, uploadParser, createTopic);
router.put("/:id", requireAuth, requireAdmin, uploadParser, updateTopic);
router.delete("/:id", requireAuth, requireAdmin, deleteTopic);

// Comments under a topic
router.get("/:topicId/comments", optionalAuth, listComments);
router.post("/:topicId/comments", requireAuth, validateBody(addCommentSchema), addComment);

export default router;
