import { Router } from "express";
import {
  login,
  adminLogin,
  me,
  register,
  verifyRegistration,
  requestLoginOtp,
  loginWithOtp,
  loginSchema,
  registerSchema,
  emailOnlySchema,
  otpSchema,
} from "../controllers/auth";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { authLimiter, emailLimiter } from "../middleware/rateLimit";

const router = Router();

// Email + password (members and verified platform users)
router.post("/login", authLimiter, validateBody(loginSchema), login);

// Platform-only signup with OTP email verification
router.post("/register", emailLimiter, validateBody(registerSchema), register);
router.post("/verify-otp", authLimiter, validateBody(otpSchema), verifyRegistration);

// Passwordless OTP login (platform users)
router.post("/request-otp", emailLimiter, validateBody(emailOnlySchema), requestLoginOtp);
router.post("/login-otp", authLimiter, validateBody(otpSchema), loginWithOtp);

// Admin (reached by URL only)
router.post("/admin/login", authLimiter, validateBody(loginSchema), adminLogin);

router.get("/me", requireAuth, me);

export default router;
