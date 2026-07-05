import { Router } from "express";
import { initiatePesapalPayment, pesapalIpn, pesapalPaymentStatus } from "../controllers/payment";
import { requireAuth, requireStudent } from "../middleware/auth";
import { paymentLimiter } from "../middleware/rateLimit";

const router = Router();

// Start a checkout — authenticated students only, tightly rate-limited.
router.post("/pesapal/initiate/:courseId", paymentLimiter, requireAuth, requireStudent, initiatePesapalPayment);

// Pesapal's server-to-server notification. Public by necessity (Pesapal calls it),
// but it grants nothing by itself — the handler re-verifies with the gateway.
router.get("/pesapal/ipn", pesapalIpn);
router.post("/pesapal/ipn", pesapalIpn);

// Outcome poll for the browser after redirect-back — owner-scoped.
router.get("/pesapal/status", requireAuth, requireStudent, pesapalPaymentStatus);

export default router;
