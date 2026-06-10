import { env } from "../../config/env";

interface BaseOptions {
  title: string;
  /** Inner HTML (already-escaped where needed). */
  body: string;
  /** Optional call-to-action button. */
  cta?: { label: string; url: string };
}

/**
 * Academy-branded responsive email shell shared by every template.
 * Cricket colors: pitch green header, clean white card.
 */
export function baseLayout({ title, body, cta }: BaseOptions): string {
  const ctaHtml = cta
    ? `<tr><td style="padding:8px 0 4px;">
         <a href="${cta.url}" style="display:inline-block;background:#16a34a;color:#ffffff;
            text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;">
            ${cta.label}</a>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr><td style="background:#15803d;padding:22px 28px;">
          <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:.3px;">🏏 Cricket Academy</span>
        </td></tr>
        <tr><td style="padding:28px 28px 8px;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${title}</h1>
          <div style="font-size:15px;line-height:1.6;color:#334155;">${body}</div>
        </td></tr>
        <tr><td style="padding:8px 28px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0">${ctaHtml}</table>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            You're receiving this because you have an account at the Cricket Academy.<br>
            ${env.CLIENT_URL}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
