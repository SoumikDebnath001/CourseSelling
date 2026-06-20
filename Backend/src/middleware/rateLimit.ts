import rateLimit from "express-rate-limit";

/**
 * Rate limiters. These cap how often a single client (by IP) can hit sensitive
 * endpoints, blunting credential brute-force, OTP guessing, and mail-bombing.
 *
 * NOTE: behind Nginx the real client IP arrives in X-Forwarded-For, so the app
 * must set `app.set("trust proxy", 1)` for these to key on the true address.
 */

const json = (message: string) => ({ success: false, message });

/** Auth attempts (login / admin login / OTP verification): tight window. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // per IP per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json("Too many attempts. Please wait a few minutes and try again."),
});

/** Outbound-email triggers (register / request OTP / contact): stricter still. */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // per IP per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json("Too many requests. Please try again later."),
});

/** A sane default ceiling for the rest of the API. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json("Too many requests. Please slow down."),
});
