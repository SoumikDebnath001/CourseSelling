import nodemailer, { Transporter } from "nodemailer";
import { env, isMailConfigured } from "../config/env";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isMailConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT ?? 587,
      secure: (env.MAIL_PORT ?? 587) === 465,
      auth: { user: env.MAIL_USER, pass: env.MAIL_PASS },
    });
  }
  return transporter;
}

/**
 * Best-effort mail send. Never throws into the request flow — a failed email must
 * not fail an enrollment or a test submission. Returns true if dispatched.
 */
export async function mailSender(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.warn(`✉️  Mail skipped (not configured) → "${subject}" to ${to}`);
    return false;
  }
  try {
    const info = await t.sendMail({ from: env.MAIL_FROM, to, subject, html });
    console.log(`✉️  Mail sent → ${to} (${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`✉️  Mail failed → ${to}:`, err instanceof Error ? err.message : err);
    return false;
  }
}

/** Fire-and-forget helper for non-blocking sends after a DB write succeeds. */
export function sendMailAsync(to: string, subject: string, html: string): void {
  void mailSender(to, subject, html);
}
