import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { ExistingUser } from "../models/external/ExistingUser";
import { ExistingAdmin } from "../models/external/ExistingAdmin";
import { OnlinePlatformUser } from "../models/OnlinePlatformUser";
import { signToken } from "../utils/token";
import { generateOtp, hashOtp, otpExpiry, isOtpValid } from "../utils/otp";
import { mailSender } from "../mail/mailSender";
import { isMailConfigured } from "../config/env";
import { otpVerifyEmail, otpLoginEmail } from "../mail/templates";
import type { AuthPayload } from "../types/auth";

/* ───────────────────────── schemas ───────────────────────── */
export const loginSchema = z.object({
  email: z.string().email("A valid email is required"),
  // Cap length so a giant string can never reach bcrypt (DoS guard). bcrypt only
  // uses the first 72 bytes, so 72 here can't lock out any existing account.
  password: z.string().min(1, "Password is required").max(72, "Password is too long"),
});
export const registerSchema = z.object({
  name: z.string().min(2, "Your name").max(80, "Name is too long"),
  email: z.string().email("A valid email is required"),
  // New platform passwords: 6–30 characters (upper bound prevents overload).
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(30, "Password must be at most 30 characters"),
});
export const emailOnlySchema = z.object({ email: z.string().email() });
export const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "Enter the 6-digit code"),
});

/** Max wrong OTP guesses before the code is burned and must be re-requested. */
const MAX_OTP_ATTEMPTS = 5;

function accountResponse(p: AuthPayload) {
  return { id: p.id, name: p.name, email: p.email, kind: p.kind, role: p.role, source: p.source };
}
function issue(res: Response, payload: AuthPayload) {
  res.json({ success: true, token: signToken(payload), account: accountResponse(payload) });
}

/* ───────────────────────── login (members + platform) ───────────────────────── */
/**
 * Email+password login. Tries the existing academy `users` first (members), then
 * this app's `onlinePlatformUser_appTwo` (platform signups). No registration here.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const lc = email.toLowerCase().trim();

  // 1) Existing academy member
  const member = await ExistingUser.findOne({ email: lc }).select("+password");
  if (member) {
    if (member.isDeleted) throw new ApiError(403, "This account has been removed");
    if (member.isActive === false) throw new ApiError(403, "This account is inactive");
    if (member.isBlocked) throw new ApiError(403, "This account is blocked");
    if (await bcrypt.compare(password, member.password ?? "")) {
      return issue(res, {
        id: member._id.toString(),
        kind: "user",
        source: "member",
        role: member.role,
        name: member.name,
        email: member.email,
      });
    }
    throw new ApiError(401, "Invalid email or password");
  }

  // 2) Platform signup
  const platform = await OnlinePlatformUser.findOne({ email: lc }).select("+password");
  if (!platform) throw new ApiError(401, "Invalid email or password");
  if (!platform.isVerified) throw new ApiError(403, "Please verify your email first");
  if (await bcrypt.compare(password, platform.password ?? "")) {
    return issue(res, {
      id: platform._id.toString(),
      kind: "user",
      source: "platform",
      name: platform.name,
      email: platform.email,
    });
  }
  throw new ApiError(401, "Invalid email or password");
});

/* ───────────────────────── platform registration ───────────────────────── */
/** Step 1: register a platform-only account and email an OTP to verify it. */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as z.infer<typeof registerSchema>;
  const lc = email.toLowerCase().trim();

  // Fail fast if mail isn't set up — otherwise the user could never verify.
  if (!isMailConfigured) {
    throw new ApiError(503, "Email service is not configured on the server, so we can't send a verification code yet.");
  }

  const member = await ExistingUser.findOne({ email: lc }).select("_id");
  if (member) throw new ApiError(409, "You already have an academy account — please log in with your password.");

  const existing = await OnlinePlatformUser.findOne({ email: lc }).select("+password");
  if (existing?.isVerified) throw new ApiError(409, "An account with this email already exists — please log in.");

  const hashed = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const otpFields = { otpHash: hashOtp(otp), otpExpiry: otpExpiry(), otpPurpose: "verify" as const, otpAttempts: 0 };

  if (existing) {
    existing.set({ name, password: hashed, ...otpFields });
    await existing.save();
  } else {
    await OnlinePlatformUser.create({ name, email: lc, password: hashed, isVerified: false, ...otpFields });
  }

  // Await the send and only confirm success if the email actually went out.
  const mail = otpVerifyEmail(name, otp);
  const sent = await mailSender(lc, mail.subject, mail.html);
  if (!sent) {
    throw new ApiError(502, "We couldn't send the verification email. Please check the address and try again.");
  }
  res.status(201).json({ success: true, message: "We've emailed you a 6-digit verification code." });
});

/** Step 2: verify the registration OTP → account activated → logged in. */
export const verifyRegistration = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body as z.infer<typeof otpSchema>;
  const user = await OnlinePlatformUser.findOne({ email: email.toLowerCase().trim() }).select(
    "+otpHash +otpExpiry +otpAttempts"
  );
  if (!user) throw new ApiError(404, "Account not found");
  if (!user.isVerified) {
    if ((user.otpAttempts ?? 0) >= MAX_OTP_ATTEMPTS) {
      user.otpHash = undefined;
      user.otpExpiry = undefined;
      await user.save();
      throw new ApiError(429, "Too many incorrect codes. Please request a new verification code.");
    }
    if (!isOtpValid(otp, user.otpHash, user.otpExpiry)) {
      user.otpAttempts = (user.otpAttempts ?? 0) + 1;
      await user.save();
      throw new ApiError(400, "Invalid or expired code");
    }
  }
  user.isVerified = true;
  user.otpHash = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;
  await user.save();
  issue(res, { id: user._id.toString(), kind: "user", source: "platform", name: user.name, email: user.email });
});

/* ───────────────────────── passwordless OTP login (platform) ───────────────────────── */
/** Request a one-time login code (platform users only). */
export const requestLoginOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as z.infer<typeof emailOnlySchema>;
  const lc = email.toLowerCase().trim();
  if (!isMailConfigured) throw new ApiError(503, "Email service is not configured on the server.");

  // 1) Academy members don't use OTP — they sign in with their password.
  const member = await ExistingUser.findOne({ email: lc }).select("_id");
  if (member) {
    throw new ApiError(400, "This email is an academy member account — please sign in with your password.");
  }

  // 2) Must be a registered (and verified) platform user before we send a code.
  const user = await OnlinePlatformUser.findOne({ email: lc });
  if (!user) throw new ApiError(404, "No account found for this email. Please sign up first.");
  if (!user.isVerified) throw new ApiError(403, "This email isn't verified yet. Sign up again to get a verification code.");

  // 3) It's a real user → send the OTP.
  const otp = generateOtp();
  user.set({ otpHash: hashOtp(otp), otpExpiry: otpExpiry(), otpPurpose: "login", otpAttempts: 0 });
  await user.save();
  const mail = otpLoginEmail(user.name, otp);
  const sent = await mailSender(lc, mail.subject, mail.html);
  if (!sent) throw new ApiError(502, "We couldn't send the login code. Please try again.");

  res.json({ success: true, message: "A login code has been sent to your email." });
});

/** Complete passwordless login with the emailed code. */
export const loginWithOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body as z.infer<typeof otpSchema>;
  const user = await OnlinePlatformUser.findOne({ email: email.toLowerCase().trim() }).select(
    "+otpHash +otpExpiry +otpAttempts"
  );
  if (!user || !user.isVerified) throw new ApiError(401, "Invalid code");
  if ((user.otpAttempts ?? 0) >= MAX_OTP_ATTEMPTS) {
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    await user.save();
    throw new ApiError(429, "Too many incorrect codes. Please request a new login code.");
  }
  if (!isOtpValid(otp, user.otpHash, user.otpExpiry)) {
    user.otpAttempts = (user.otpAttempts ?? 0) + 1;
    await user.save();
    throw new ApiError(400, "Invalid or expired code");
  }
  user.otpHash = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;
  await user.save();
  issue(res, { id: user._id.toString(), kind: "user", source: "platform", name: user.name, email: user.email });
});

/* ───────────────────────── admin (URL-only, unchanged) ───────────────────────── */
export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const admin = await ExistingAdmin.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!admin) throw new ApiError(401, "Invalid email or password");
  if (admin.isDeleted) throw new ApiError(403, "This admin account has been removed");
  if (!(await bcrypt.compare(password, admin.password ?? ""))) throw new ApiError(401, "Invalid email or password");
  issue(res, { id: admin._id.toString(), kind: "admin", name: admin.name, email: admin.email });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new ApiError(401, "Authentication required");
  res.json({ success: true, account: accountResponse(req.auth) });
});
