import crypto from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000)); // 6 digits
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function otpExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export function isOtpValid(input: string, storedHash?: string, expiry?: Date): boolean {
  if (!storedHash || !expiry) return false;
  if (expiry.getTime() < Date.now()) return false;
  const a = Buffer.from(hashOtp(input));
  const b = Buffer.from(storedHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
