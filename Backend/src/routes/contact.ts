import { Router } from "express";
import { submitContact, contactSchema } from "../controllers/contact";
import { validateBody } from "../middleware/validate";
import { emailLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/", emailLimiter, validateBody(contactSchema), submitContact);

export default router;
