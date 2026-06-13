/** Escapes user-supplied text before inlining it into the certificate HTML. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

interface CertificateInput {
  studentName: string;
  courseName: string;
  /** Accent colour (hex). Falls back to the brand indigo. */
  color?: string;
  date?: Date;
}

/**
 * Opens a print-ready, horizontal (landscape) completion certificate in a new
 * window so the browser can save it as a PDF. The layout is generic for every
 * course; only the accent `color` changes per course (set by the admin).
 */
export function generateCertificate({ studentName, courseName, color, date = new Date() }: CertificateInput) {
  const accent = /^#[0-9a-fA-F]{6}$/.test(color ?? "") ? color! : "#4f46e5";
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return;

  const issued = date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const certId = `CA-${date.getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Certificate — ${escapeHtml(courseName)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, "Times New Roman", serif; background: #e9eaf0; }
  .sheet {
    position: relative;
    width: 1040px; height: 735px;
    margin: 24px auto;
    background: #ffffff;
    border: 14px solid ${accent};
    outline: 2px solid ${accent};
    outline-offset: -22px;
    padding: 64px 72px;
    display: flex; flex-direction: column; align-items: center; text-align: center;
  }
  .corner { position: absolute; width: 56px; height: 56px; border: 4px solid ${accent}; }
  .corner.tl { top: 18px; left: 18px; border-right: 0; border-bottom: 0; }
  .corner.tr { top: 18px; right: 18px; border-left: 0; border-bottom: 0; }
  .corner.bl { bottom: 18px; left: 18px; border-right: 0; border-top: 0; }
  .corner.br { bottom: 18px; right: 18px; border-left: 0; border-top: 0; }
  .brand { display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 700; color: ${accent}; letter-spacing: .5px; }
  .kicker { margin-top: 26px; font-size: 15px; letter-spacing: 6px; text-transform: uppercase; color: #8a90a0; }
  .title { margin-top: 6px; font-size: 46px; font-weight: 700; color: #1f2430; letter-spacing: 2px; }
  .sub { margin-top: 28px; font-size: 16px; color: #6b7280; font-style: italic; }
  .name { margin-top: 12px; font-size: 40px; font-weight: 700; color: ${accent}; padding: 0 24px 8px; border-bottom: 2px solid #e2e4ea; }
  .for { margin-top: 24px; font-size: 16px; color: #6b7280; }
  .course { margin-top: 6px; font-size: 26px; font-weight: 700; color: #1f2430; max-width: 760px; }
  .foot { margin-top: auto; width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 36px; }
  .foot .block { text-align: center; min-width: 220px; }
  .foot .line { border-top: 1.5px solid #1f2430; padding-top: 8px; font-size: 14px; color: #1f2430; font-weight: 700; }
  .foot .label { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #8a90a0; margin-top: 2px; }
  .seal { width: 92px; height: 92px; border-radius: 50%; background: ${accent}; color: #fff; display: flex; align-items: center; justify-content: center; flex-direction: column; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 0 0 6px ${accent}22; }
  .seal b { font-size: 22px; }
  .certid { position: absolute; bottom: 26px; left: 0; right: 0; text-align: center; font-size: 11px; color: #aeb3c0; font-family: Arial, sans-serif; }
  @media print { body { background: #fff; } .sheet { margin: 0; border-width: 14px; } }
</style>
</head>
<body>
  <div class="sheet">
    <span class="corner tl"></span><span class="corner tr"></span>
    <span class="corner bl"></span><span class="corner br"></span>

    <div class="brand">🏏 Cricket Academy</div>
    <div class="kicker">Certificate of Completion</div>
    <div class="title">CERTIFICATE</div>

    <div class="sub">This is proudly presented to</div>
    <div class="name">${escapeHtml(studentName)}</div>

    <div class="for">for successfully completing the course</div>
    <div class="course">${escapeHtml(courseName)}</div>

    <div class="foot">
      <div class="block">
        <div class="line">${escapeHtml(issued)}</div>
        <div class="label">Date</div>
      </div>
      <div class="seal"><b>★</b>Cricket<br/>Academy</div>
      <div class="block">
        <div class="line">Cricket Academy</div>
        <div class="label">Authorised Signatory</div>
      </div>
    </div>

    <div class="certid">Certificate ID: ${certId}</div>
  </div>

  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}
