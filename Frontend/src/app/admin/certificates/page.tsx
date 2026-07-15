"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Award, Search, PenLine, Eye, Save, QrCode } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useIssuedCertificates } from "@/hooks/useAdmin";
import { useSettings, useUpdateSettings, useUploadCertificateSignature } from "@/hooks/useSettings";
import { generateCertificate } from "@/lib/certificate";
import { formatKenyaDate, formatBytes, formatLabel } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const formatDate = (iso: string) => formatKenyaDate(iso);

/** Coach name, role lines and the uploaded transparent-PNG signature printed on every certificate. */
function CertificateBrandingCard() {
  const { settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const uploadSignature = useUploadCertificateSignature();

  const [coachName, setCoachName] = useState("");
  const [roleLine1, setRoleLine1] = useState("");
  const [roleLine2, setRoleLine2] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isLoading && !hydrated) {
      setCoachName(settings.certificate?.coachName ?? "");
      setRoleLine1(settings.certificate?.roleLine1 ?? "");
      setRoleLine2(settings.certificate?.roleLine2 ?? "");
      setHydrated(true);
    }
  }, [isLoading, hydrated, settings.certificate]);

  const dirty =
    coachName !== (settings.certificate?.coachName ?? "") ||
    roleLine1 !== (settings.certificate?.roleLine1 ?? "") ||
    roleLine2 !== (settings.certificate?.roleLine2 ?? "");

  const preview = () =>
    generateCertificate({
      studentName: "Student Name",
      courseName: "Sample Course",
      branding: { coachName, roleLine1, roleLine2, signatureUrl: settings.certificate?.signatureUrl },
    });

  return (
    <div className="card mt-6 p-5">
      <div className="flex items-center gap-2">
        <PenLine className="h-5 w-5 text-grape-600" />
        <div>
          <p className="font-semibold text-ink-900">Certificate signatory &amp; signature</p>
          <p className="text-xs text-ink-400">
            Printed at the bottom of every completion certificate. The certificate date and serial number are
            auto-generated in Kenya time — IDs run OGR-&lt;year&gt;-0001 and the year rolls over automatically.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase text-ink-400">Coach name</span>
          <input className="input" value={coachName} placeholder="Coach David Obuya" onChange={(e) => setCoachName(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase text-ink-400">Role line 1</span>
          <input className="input" value={roleLine1} placeholder="High Performance Coach Level 3" onChange={(e) => setRoleLine1(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase text-ink-400">Role line 2</span>
          <input className="input" value={roleLine2} placeholder="ICC Tutor — Africa" onChange={(e) => setRoleLine2(e.target.value)} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <span className="mb-1 block text-xs font-semibold uppercase text-ink-400">Signature</span>
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-40 overflow-hidden rounded-lg border border-ink-200 bg-[repeating-conic-gradient(#f1f2f4_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px]">
              {settings.certificate?.signatureUrl ? (
                <Image src={settings.certificate.signatureUrl} alt="Signature" fill className="object-contain p-1" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-ink-400">Default signature</div>
              )}
            </div>
            <label className="cursor-pointer rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
              {uploadSignature.isPending ? "Uploading…" : "Upload signature"}
              <input
                type="file"
                accept="image/png"
                className="hidden"
                disabled={uploadSignature.isPending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadSignature.mutate(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="mt-1.5 max-w-md text-[11px] text-ink-400">
            Background-less (transparent) <b>PNG format only</b> · roughly 3:1 width-to-height looks best · max 10MB.
          </p>
          {/* What's uploaded right now — filename, format and size. */}
          {settings.certificate?.signatureName && (
            <p className="mt-1 text-[11px] font-medium text-pitch-700">
              Uploaded: {settings.certificate.signatureName} ·{" "}
              {formatLabel(settings.certificate.signatureFormat, settings.certificate.signatureName)} ·{" "}
              {formatBytes(settings.certificate.signatureSize)}
            </p>
          )}
        </div>

        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={preview}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button
            loading={update.isPending}
            disabled={!dirty}
            onClick={() => update.mutate({ certificate: { coachName, roleLine1, roleLine2 } })}
          >
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-1.5 rounded-lg border border-ink-100 bg-ink-50/60 p-3 text-xs text-ink-500">
        <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
        Every issued certificate carries a QR code. Scanning it opens the public verification page, which shows
        only the certificate ID, student name, course name, course ID and generation date.
      </p>
    </div>
  );
}

export default function IssuedCertificatesPage() {
  const [search, setSearch] = useState("");
  const { data: certificates, isLoading } = useIssuedCertificates(search);

  return (
    <AdminShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Issued Certificates</h1>
          <p className="mt-1 text-sm text-ink-400">
            The permanent registry of certificate IDs — each is issued once and never changes, no matter how many
            times the student downloads the certificate.
          </p>
        </div>
        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, student or course…"
            className="input h-10 w-full pl-9 sm:w-72"
          />
        </div>
      </div>

      <CertificateBrandingCard />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
      ) : certificates && certificates.length > 0 ? (
        <div className="card mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3">Certificate ID</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Issued</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((c) => (
                <tr key={c._id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-mono font-semibold text-ink-900">
                    <a href={`/verify/${encodeURIComponent(c.certificateId)}`} target="_blank" rel="noreferrer" title="Open the public verification page" className="hover:text-brand-600 hover:underline">
                      {c.certificateId}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{c.studentName ?? "—"}</div>
                    {c.studentEmail && <div className="text-xs text-ink-400">{c.studentEmail}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{c.courseName}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-sun-400/20 px-2 py-0.5 text-xs font-semibold text-sun-500">
                      {c.label ?? c.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(c.issuedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card mt-5 p-10 text-center">
          <Award className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-2 text-ink-500">
            {search ? "No certificates match your search." : "No certificates have been issued yet."}
          </p>
        </div>
      )}
    </AdminShell>
  );
}
