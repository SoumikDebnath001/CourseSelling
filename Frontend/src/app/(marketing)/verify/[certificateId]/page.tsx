"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ShieldX, Award } from "lucide-react";
import { api } from "@/lib/axios";
import { formatKenyaDate } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";

/** The five public fields the QR code resolves to — nothing more is ever shown. */
interface VerifiedCertificate {
  certificateId: string;
  studentName: string;
  courseName: string;
  courseId: string;
  issuedAt: string;
}

const CERT_ID_RE = /^OGR-\d{4}-\d{4,8}$/;

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</span>
      <span className={mono ? "font-mono text-sm font-semibold text-ink-900" : "text-sm font-medium text-ink-900"}>
        {value}
      </span>
    </div>
  );
}

export default function VerifyCertificatePage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = use(params);
  const id = decodeURIComponent(certificateId ?? "").trim().toUpperCase();
  const validFormat = CERT_ID_RE.test(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["verify-certificate", id],
    queryFn: async () => {
      const { data } = await api.get<{ certificate: VerifiedCertificate }>(`/certificates/verify/${encodeURIComponent(id)}`);
      return data.certificate;
    },
    enabled: validFormat,
    retry: false,
  });

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-14 sm:py-20">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-amber-600 text-white shadow-lg">
          <Award className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink-900">Certificate Verification</h1>
        <p className="mt-1 text-sm text-ink-500">Checked against the academy&apos;s official certificate registry.</p>
      </div>

      <div className="card mt-8 p-6">
        {!validFormat || isError ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-gold-50">
              <ShieldX className="h-6 w-6 text-rose-gold-600" />
            </div>
            <h2 className="mt-3 text-lg font-bold text-ink-900">Certificate not found</h2>
            <p className="mt-1 text-sm text-ink-500">
              {validFormat
                ? `No certificate with the ID “${id}” exists in our registry. It may have been mistyped — or it is not genuine.`
                : "That doesn't look like a valid certificate ID. IDs look like OGR-2026-0001."}
            </p>
          </div>
        ) : isLoading || !data ? (
          <div className="flex justify-center py-10"><Spinner className="h-7 w-7" /></div>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-xl bg-pitch-50 px-4 py-3">
              <BadgeCheck className="h-5 w-5 shrink-0 text-pitch-600" />
              <p className="text-sm font-semibold text-pitch-700">This certificate is valid and was issued by the academy.</p>
            </div>
            <div className="mt-4">
              <Row label="Certificate ID" value={data.certificateId} mono />
              <Row label="Student name" value={data.studentName || "—"} />
              <Row label="Course name" value={data.courseName} />
              <Row label="Course ID" value={data.courseId} mono />
              <Row label="Generated on" value={formatKenyaDate(data.issuedAt, { month: "long" })} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
