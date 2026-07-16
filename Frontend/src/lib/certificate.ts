/** Escapes user-supplied text before inlining it into the certificate HTML. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export type CertificateOrientation = "portrait" | "landscape";

/** One signatory block printed at the bottom of the certificate (admin-editable). */
export interface CertificateSignatoryView {
  name?: string;
  roleLine1?: string;
  roleLine2?: string;
  /** Uploaded transparent PNG signature; falls back to the bundled artwork. */
  signatureUrl?: string;
}

/**
 * Resolves a course's selected signatory ids against the settings pool. Falls back to
 * the first signatory in the pool, then to the legacy single-signatory settings fields,
 * so a certificate always carries at least one signature block.
 */
export function resolveSignatories(
  ids: string[] | undefined,
  certificate?: {
    coachName?: string;
    roleLine1?: string;
    roleLine2?: string;
    signatureUrl?: string;
    signatories?: Array<CertificateSignatoryView & { _id: string }>;
  }
): CertificateSignatoryView[] {
  const pool = certificate?.signatories ?? [];
  const picked = (ids ?? [])
    .map((id) => pool.find((s) => s._id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);
  if (picked.length) return picked;
  if (pool.length) return [pool[0]];
  return [
    {
      name: certificate?.coachName,
      roleLine1: certificate?.roleLine1,
      roleLine2: certificate?.roleLine2,
      signatureUrl: certificate?.signatureUrl,
    },
  ];
}

interface CertificateInput {
  studentName: string;
  courseName: string;
  /** Accent colour (hex) applied to the course title. Falls back to charcoal. */
  color?: string;
  date?: Date;
  /** "portrait" (vertical, default) or "landscape" (horizontal). */
  orientation?: CertificateOrientation;
  /**
   * The permanent certificate id issued by the server when the certificate was
   * earned (OGR-YEAR-0001 style). It never changes across re-downloads.
   * Omitted only for admin previews, which print a sample id.
   */
  serial?: string;
  /** Signature blocks (course's selected signatories, max 3) from admin settings. */
  signatories?: CertificateSignatoryView[];
}

/** Certificate dates always render in Kenya (Africa/Nairobi) time. */
const KENYA_TZ = "Africa/Nairobi";

/**
 * Opens a print-ready A4 completion certificate (vertical or horizontal) in a
 * new window so the browser can save it as a high-resolution PDF (all text
 * stays vector). The layout is generic for every course and uses the official
 * Obuya Cricket Academy artwork in /public/certificate: gold frame, ribbon
 * medallion and the academy + foundation logos. The signatory block and the
 * signature image come from the admin's certificate settings. Real (serial-
 * bearing) certificates carry a QR code linking to the public /verify page.
 */
export async function generateCertificate({
  studentName,
  courseName,
  color,
  date = new Date(),
  orientation = "portrait",
  serial,
  signatories,
}: CertificateInput) {
  const accent = /^#[0-9a-fA-F]{6}$/.test(color ?? "") ? color! : "#23281c";
  const landscape = orientation === "landscape";
  // Open the window synchronously (inside the user's click) so popup blockers allow it;
  // the QR code is generated afterwards and the document written when ready.
  const win = window.open("", "_blank", landscape ? "width=1200,height=900" : "width=900,height=1200");
  if (!win) return;

  // Certificate dates are Kenya time, with the timezone stated on the certificate.
  const issued = `${date.toLocaleDateString("en-GB", { timeZone: KENYA_TZ, year: "numeric", month: "long", day: "numeric" })} (EAT)`;
  const certId = serial || `OGR-${date.getFullYear()}-0000`;
  const asset = (name: string) => `${window.location.origin}/certificate/${name}`;

  // One signature block per selected signatory (max 3 fit next to the QR code).
  // With more blocks each one narrows so the row still fits both page widths.
  const blocks = (signatories?.length ? signatories : [{}]).slice(0, 3).map((s) => ({
    name: s.name?.trim() || "Coach David Obuya",
    roleLine1: s.roleLine1?.trim() || "High Performance Coach Level 3",
    roleLine2: s.roleLine2?.trim() || "ICC Tutor — Africa",
    signatureUrl: s.signatureUrl || asset("signature.png"),
  }));
  const blockMinWidth = blocks.length >= 3 ? 110 : blocks.length === 2 ? 150 : 230;
  const footGap = blocks.length >= 3 ? 10 : 24;
  const sigBlocksHtml = blocks
    .map(
      (b) => `<div class="block">
          <img class="sig" src="${escapeHtml(b.signatureUrl)}" alt="" />
          <div class="line">${escapeHtml(b.name)}</div>
          <div class="role">${escapeHtml(b.roleLine1)}<br/>${escapeHtml(b.roleLine2)}</div>
        </div>`
    )
    .join("\n        ");

  // QR code → the public verification page for this certificate id. Only real
  // certificates (with a server-issued serial) get one; previews show a placeholder.
  let qrDataUrl: string | null = null;
  if (serial) {
    try {
      const QRCode = (await import("qrcode")).default;
      qrDataUrl = await QRCode.toDataURL(`${window.location.origin}/verify/${encodeURIComponent(serial)}`, {
        margin: 0,
        width: 240,
        errorCorrectionLevel: "M",
        color: { dark: "#23281c", light: "#00000000" },
      });
    } catch {
      qrDataUrl = null; // never block the download on QR generation
    }
  }
  const qrBlock = qrDataUrl
    ? `<div class="qrblock"><img class="qr" src="${qrDataUrl}" alt="Scan to verify" /><div class="qr-caption">Scan to verify</div></div>`
    : `<div class="qrblock"><div class="qr qr-placeholder">Verification<br/>QR</div><div class="qr-caption">Sample preview</div></div>`;

  // Orientation-specific styles. The portrait sheet uses the frame artwork at
  // its native aspect ratio; the landscape sheet rebuilds it with border-image
  // so the corner flourishes are not distorted by the wider page.
  const sheet = landscape ? "width: 1123px; height: 794px;" : "width: 794px; height: 1123px;";
  const frame = landscape
    ? `.frame { position: absolute; inset: 0; pointer-events: none; border: 130px solid transparent; border-image: url("${asset("frame.png")}") 190 stretch; }`
    : `.frame { position: absolute; inset: 0; width: 100%; height: 100%; }`;
  const frameEl = landscape ? `<div class="frame"></div>` : `<img class="frame" src="${asset("frame.png")}" alt="" />`;
  const layout = landscape
    ? `
  .ribbon { position: absolute; left: -112px; top: 0; height: 100%; }
  .content { position: absolute; top: 0; bottom: 0; left: 300px; right: 70px; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 48px 12px 72px; }
  .logos img { height: 76px; }
  .academy-name { margin-top: 14px; }
  .title { margin-top: 20px; font-size: 48px; }
  .title-sub { margin-top: 6px; font-size: 14px; }
  .divider { margin-top: 14px; }
  .divider .rule { width: 130px; }
  .presented { margin-top: 18px; font-size: 13px; }
  .name { margin-top: 8px; font-size: 50px; }
  .name-rule { margin-top: 8px; width: 360px; }
  .for { margin-top: 14px; max-width: 560px; }
  .course { margin-top: 6px; font-size: 23px; max-width: 620px; }
  .meta { margin-top: 14px; font-size: 12px; }
  .foot { padding-top: 18px; }
  .block .sig { height: 54px; }
  .block .line { padding-top: 7px; font-size: 13px; }
  .block .role { font-size: 10px; }
  .qrblock .qr { width: 74px; height: 74px; }
  .motto { bottom: 40px; left: 300px; right: 70px; }`
    : `
  .ribbon { position: absolute; left: -158px; top: 0; height: 100%; }
  .content { position: absolute; top: 0; bottom: 0; left: 248px; right: 62px; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 72px 12px 92px; }
  .logos img { height: 96px; }
  .academy-name { margin-top: 18px; }
  .title { margin-top: 44px; font-size: 56px; }
  .title-sub { margin-top: 8px; font-size: 15px; }
  .divider { margin-top: 22px; }
  .divider .rule { width: 110px; }
  .presented { margin-top: 34px; font-size: 14px; }
  .name { margin-top: 14px; font-size: 58px; }
  .name-rule { margin-top: 10px; width: 340px; }
  .for { margin-top: 26px; max-width: 420px; }
  .course { margin-top: 12px; font-size: 27px; max-width: 460px; }
  .meta { margin-top: 26px; font-size: 12.5px; }
  .foot { padding-top: 20px; }
  .block .sig { height: 62px; }
  .block .line { padding-top: 8px; font-size: 14px; }
  .block .role { font-size: 10.5px; }
  .qrblock .qr { width: 84px; height: 84px; }
  .motto { bottom: 48px; left: 248px; right: 62px; }`;

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Certificate — ${escapeHtml(courseName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Great+Vibes&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #e9eaf0; font-family: "Montserrat", Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { position: relative; ${sheet} margin: 0 auto; background: #fffdf8; overflow: hidden; }
  ${frame}
  .logos { display: flex; align-items: center; justify-content: center; gap: 32px; }
  .logos img { width: auto; }
  .academy-name { font-size: 15px; font-weight: 700; letter-spacing: 5px; color: #1c4620; text-transform: uppercase; }
  .academy-sub { margin-top: 4px; font-size: 10px; font-weight: 500; letter-spacing: 3.2px; color: #a58224; text-transform: uppercase; }
  .title { font-family: "Playfair Display", Georgia, serif; font-weight: 700; letter-spacing: 10px; color: #23281c; }
  .title-sub { font-weight: 600; letter-spacing: 8px; color: #a58224; text-transform: uppercase; }
  .divider { display: flex; align-items: center; gap: 10px; color: #c9a227; }
  .divider .rule { height: 1.5px; background: linear-gradient(90deg, transparent, #c9a227); }
  .divider .rule.r { background: linear-gradient(90deg, #c9a227, transparent); }
  .divider .dot { font-size: 12px; }
  .presented { letter-spacing: 2px; color: #6b7060; text-transform: uppercase; }
  .name { font-family: "Great Vibes", "Segoe Script", cursive; font-weight: 400; color: #1c4620; line-height: 1.1; max-width: 100%; }
  .name-rule { height: 1.5px; background: linear-gradient(90deg, transparent, #c9a227 25%, #c9a227 75%, transparent); }
  .for { font-size: 13.5px; line-height: 1.7; color: #6b7060; }
  .course { font-family: "Playfair Display", Georgia, serif; font-weight: 600; color: ${accent}; line-height: 1.3; }
  .meta { letter-spacing: 1px; color: #6b7060; }
  .meta b { color: #23281c; letter-spacing: 1.5px; }
  .meta .issued { margin-top: 6px; }
  .foot { margin-top: auto; width: 100%; display: flex; justify-content: space-between; align-items: flex-end; gap: ${footGap}px; padding-left: 8px; padding-right: 8px; }
  .block { text-align: center; min-width: ${blockMinWidth}px; }
  .block .sig { margin-bottom: -8px; }
  .block .line { border-top: 1.5px solid #23281c; margin-top: 6px; font-weight: 700; letter-spacing: 1px; color: #23281c; text-transform: uppercase; }
  .block .role { margin-top: 3px; font-weight: 500; letter-spacing: 1px; color: #6b7060; line-height: 1.6; }
  .qrblock { text-align: center; }
  .qrblock .qr-placeholder { display: flex; align-items: center; justify-content: center; border: 1.5px dashed #c9a227; border-radius: 8px; font-size: 9px; letter-spacing: 1px; color: #a58224; text-transform: uppercase; line-height: 1.5; }
  .qrblock .qr-caption { margin-top: 5px; font-size: 8.5px; font-weight: 600; letter-spacing: 1.6px; color: #6b7060; text-transform: uppercase; }
  .motto { position: absolute; text-align: center; font-size: 10px; letter-spacing: 4px; color: #a58224; text-transform: uppercase; }
  ${layout}
  @media print { body { background: #fff; } .sheet { margin: 0; } }
</style>
</head>
<body>
  <div class="sheet">
    <img class="ribbon" src="${asset("ribbon.png")}" alt="" />
    ${frameEl}

    <div class="content">
      <div class="logos">
        <img src="${asset("logo-foundation.png")}" alt="Obuya Grassroots Foundation" />
        <img src="${asset("logo-academy.png")}" alt="Obuya Cricket Academy" />
      </div>
      <div class="academy-name">Obuya Cricket Academy</div>
      <div class="academy-sub">The High Performance Centre of Excellence</div>

      <div class="title">CERTIFICATE</div>
      <div class="title-sub">of Completion</div>
      <div class="divider"><span class="rule"></span><span class="dot">◆</span><span class="rule r"></span></div>

      <div class="presented">This certificate is proudly presented to</div>
      <div class="name">${escapeHtml(studentName)}</div>
      <div class="name-rule"></div>

      <div class="for">for successfully completing all requirements of the course</div>
      <div class="course">${escapeHtml(courseName)}</div>

      <div class="meta">
        <div>Certificate ID <b>${escapeHtml(certId)}</b></div>
        <div class="issued">Issued on <b>${escapeHtml(issued)}</b></div>
      </div>

      <div class="foot">
        ${qrBlock}
        ${sigBlocksHtml}
      </div>
    </div>

    <div class="motto">Educate&nbsp;&nbsp;·&nbsp;&nbsp;Empower&nbsp;&nbsp;·&nbsp;&nbsp;Elevate</div>
  </div>

  <script>
    window.onload = function () {
      var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      ready.then(function () { setTimeout(function () { window.print(); }, 150); });
    };
  </script>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}
