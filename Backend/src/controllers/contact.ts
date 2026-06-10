import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { mailSender } from "../mail/mailSender";
import { baseLayout } from "../mail/templates/baseLayout";
import { env } from "../config/env";

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
  const html = baseLayout({
    title: `New enquiry: ${subject}`,
    body: `<p><strong>From:</strong> ${name} (${email})</p><p>${message.replace(/\n/g, "<br>")}</p>`,
  });
  const to = env.MAIL_USER || env.MAIL_FROM;
  await mailSender(to, `[Courses] ${subject}`, html);
  res.json({ success: true, message: "Thanks — we'll get back to you soon." });
});
