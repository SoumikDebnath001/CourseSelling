import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { mailSender } from "../mail/mailSender";
import { baseLayout } from "../mail/templates/baseLayout";
import { env } from "../config/env";
import { escapeHtml } from "../utils/escapeHtml";

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
  message: z.string().min(5),
});

/**
 * Contact form → emails the academy inbox. Intentionally writes NOTHING to the
 * database (the existing app owns the Inquiry collection; this app never touches it).
 */
export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body as z.infer<typeof contactSchema>;
  // Escape every user-supplied value before it lands in the HTML email body.
  const html = baseLayout({
    title: `New enquiry: ${escapeHtml(subject)}`,
    body: `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
  });
  const to = env.MAIL_USER || env.MAIL_FROM;
  await mailSender(to, `[Courses] ${subject}`, html);
  res.json({ success: true, message: "Thanks — we'll get back to you soon." });
});
