import { baseLayout } from "./baseLayout";
import { env } from "../../config/env";

function otpBlock(otp: string): string {
  return `<div style="margin:18px 0;text-align:center;">
      <span style="display:inline-block;background:#eef2ff;color:#4338ca;font-size:30px;font-weight:800;
        letter-spacing:8px;padding:14px 26px;border-radius:12px;">${otp}</span>
    </div>
    <p style="font-size:13px;color:#64748b;">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Renders the admin-editable Terms & Conditions text as email HTML.
 * Convention (same as the registration pop-up): "## " → heading, "- " → bullet,
 * blank line → paragraph break.
 */
function termsBlock(terms: string): string {
  const out: string[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    out.push(`<ul style="margin:6px 0 10px;padding-left:20px;">${bullets.map((b) => `<li style="margin:2px 0;">${b}</li>`).join("")}</ul>`);
    bullets = [];
  };
  for (const raw of terms.split("\n")) {
    const line = escapeHtml(raw.trim());
    if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
      continue;
    }
    flush();
    if (!line) continue;
    if (line.startsWith("## ")) out.push(`<h3 style="margin:14px 0 4px;font-size:13px;color:#0f172a;">${line.slice(3)}</h3>`);
    else out.push(`<p style="margin:6px 0;">${line}</p>`);
  }
  flush();
  return `<div style="margin-top:22px;border-top:1px solid #e2e8f0;padding-top:16px;">
      <h2 style="margin:0 0 8px;font-size:15px;color:#0f172a;">Terms &amp; Conditions — Consent and Participation Agreement</h2>
      <p style="margin:0 0 10px;font-size:12px;color:#64748b;">You accepted these terms when creating your account. Keep this email for your records.</p>
      <div style="font-size:12px;line-height:1.6;color:#475569;">${out.join("")}</div>
    </div>`;
}

export function otpVerifyEmail(name: string, otp: string, terms?: string) {
  return {
    subject: "Verify your email — Cricket Academy",
    html: baseLayout({
      title: "Confirm your email ✉️",
      body: `<p>Hi ${name},</p><p>Welcome! Use this code to verify your email and activate your account:</p>${otpBlock(otp)}${terms ? termsBlock(terms) : ""}`,
    }),
  };
}

export function otpLoginEmail(name: string, otp: string) {
  return {
    subject: "Your login code — Cricket Academy",
    html: baseLayout({
      title: "Your one-time login code 🔐",
      body: `<p>Hi ${name},</p><p>Use this code to sign in:</p>${otpBlock(otp)}`,
    }),
  };
}

export function courseEnrollmentEmail(name: string, courseName: string, courseSlug: string) {
  return {
    subject: `You're enrolled: ${courseName}`,
    html: baseLayout({
      title: `Welcome to ${courseName} 🏏`,
      body: `<p>Hi ${name},</p>
        <p>You're now enrolled in <strong>${courseName}</strong>. Jump in and start learning —
        your progress is saved as you complete each topic.</p>`,
      cta: { label: "Start the course", url: `${env.CLIENT_URL}/courses/${courseSlug}` },
    }),
  };
}

export function testResultEmail(name: string, testTitle: string, scorePct: number, passed: boolean) {
  return {
    subject: `${passed ? "Passed" : "Result"}: ${testTitle}`,
    html: baseLayout({
      title: passed ? `Great work — you passed! ✅` : `Test result: ${testTitle}`,
      body: `<p>Hi ${name},</p>
        <p>You scored <strong>${scorePct}%</strong> on <strong>${testTitle}</strong>.</p>
        <p>${passed ? "Congratulations on clearing this test!" : "You can review the material and try again."}</p>`,
    }),
  };
}

export function coursePassedEmail(name: string, courseName: string) {
  return {
    subject: `Course completed: ${courseName}`,
    html: baseLayout({
      title: `You've completed ${courseName} 🏆`,
      body: `<p>Hi ${name},</p>
        <p>You passed the final test for <strong>${courseName}</strong>. Well played — that's the
        whole course done. Keep up the momentum with your next one.</p>`,
      cta: { label: "Explore more courses", url: `${env.CLIENT_URL}/catalog` },
    }),
  };
}

export function commentReplyEmail(name: string, replierName: string, courseName: string, courseSlug: string) {
  return {
    subject: `${replierName} replied to your comment`,
    html: baseLayout({
      title: `New reply in ${courseName}`,
      body: `<p>Hi ${name},</p>
        <p><strong>${replierName}</strong> replied to your comment in <strong>${courseName}</strong>.</p>`,
      cta: { label: "View the discussion", url: `${env.CLIENT_URL}/courses/${courseSlug}` },
    }),
  };
}
