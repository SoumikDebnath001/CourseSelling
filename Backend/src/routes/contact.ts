import { Router } from "express";
import { submitContact, contactSchema } from "../controllers/contact";
import { validateBody } from "../middleware/validate";

const router = Router();

router.post("/", validateBody(contactSchema), submitContact);

export default router;
