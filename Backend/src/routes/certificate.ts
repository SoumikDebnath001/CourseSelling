import { Router } from "express";
import { verifyCertificate } from "../controllers/certificate";
import { verifyLimiter } from "../middleware/rateLimit";

const router = Router();

// Public QR-code verification — no auth, but tightly rate-limited so the
// registry can't be scraped by walking sequential ids.
router.get("/verify/:certificateId", verifyLimiter, verifyCertificate);

export default router;
