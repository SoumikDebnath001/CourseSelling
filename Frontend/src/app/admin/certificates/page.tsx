"use client";

import { useState } from "react";
import Image from "next/image";
import { Award, Search, PenLine, Eye, Save, QrCode, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useIssuedCertificates } from "@/hooks/useAdmin";
import { useSettings, useAddSignatory, useUpdateSignatory, useDeleteSignatory } from "@/hooks/useSettings";
import { generateCertificate } from "@/lib/certificate";
import { formatKenyaDate, formatBytes, formatLabel } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { CertificateSignatory } from "@/types/api";

const formatDate = (iso: string) => formatKenyaDate(iso);

/** Signature preview thumbnail + PNG upload button shared by the rows below. */
function SignatureUpload({
  url,
  uploading,
  onFile,
}: {
  url?: string;
  uploading: boolean;
  onFile: (f: File) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-36 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-[repeating-conic-gradient(#f1f2f4_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px]">
        {url ? (
          <Image src={url} alt="Signature" fill className="object-contain p-1" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-400">Default signature</div>
        )}
      </div>
      <label className="cursor-pointer rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
        {uploading ? "Uploading…" : "Upload signature"}
        <input
          type="file"
          accept="image/png"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

/** One editable signatory row: name, role lines, signature image, preview and delete. */
function SignatoryRow({ signatory, canDelete }: { signatory: CertificateSignatory; canDelete: boolean }) {
  const update = useUpdateSignatory();
  const remove = useDeleteSignatory();
  const [name, setName] = useState(signatory.name);
  const [roleLine1, setRoleLine1] = useState(signatory.roleLine1 ?? "");
  const [roleLine2, setRoleLine2] = useState(signatory.roleLine2 ?? "");

  const dirty =
    name !== signatory.name ||
    roleLine1 !== (signatory.roleLine1 ?? "") ||
    roleLine2 !== (signatory.roleLine2 ?? "");

  const preview = () =>
    generateCertificate({
      studentName: "Student Name",
      courseName: "Sample Course",
      signatories: [{ name, roleLine1, roleLine2, signatureUrl: signatory.signatureUrl }],
    });

  return (
    <div className="rounded-xl border border-ink-100 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase text-ink-400">Name</span>
          <input className="input" value={name} placeholder="Coach David Obuya" onChange={(e) => setName(e.target.value)} />
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

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div>
          <SignatureUpload
            url={signatory.signatureUrl}
            uploading={update.isPending}
            onFile={(file) => update.mutate({ id: signatory._id, signature: file })}
          />
          {signatory.signatureName && (
            <p className="mt-1 text-[11px] font-medium text-pitch-700">
              Uploaded: {signatory.signatureName} · {formatLabel(signatory.signatureFormat, signatory.signatureName)} ·{" "}
              {formatBytes(signatory.signatureSize)}
            </p>
          )}
        </div>

        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={preview}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button
            loading={update.isPending}
            disabled={!dirty || name.trim().length < 2}
            onClick={() => update.mutate({ id: signatory._id, name, roleLine1, roleLine2 })}
          >
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            disabled={!canDelete}
            title={canDelete ? "Remove signatory" : "At least one signatory is required"}
            onClick={() => {
              if (window.confirm(`Remove ${signatory.name}? Courses using this signature fall back to the first signatory.`)) {
                remove.mutate(signatory._id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Form to add a new person to the signatories pool. */
function AddSignatoryForm() {
  const add = useAddSignatory();
  const [name, setName] = useState("");
  const [roleLine1, setRoleLine1] = useState("");
  const [roleLine2, setRoleLine2] = useState("");
  const [signature, setSignature] = useState<File | null>(null);

  const submit = () =>
    add.mutate(
      { name, roleLine1, roleLine2, signature },
      {
        onSuccess: () => {
          setName("");
          setRoleLine1("");
          setRoleLine2("");
          setSignature(null);
        },
      }
    );

  return (
    <div className="rounded-xl border border-dashed border-ink-300 p-4">
      <p className="text-sm font-semibold text-ink-700">Add a signatory</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <input className="input" value={name} placeholder="Name (required)" onChange={(e) => setName(e.target.value)} />
        <input className="input" value={roleLine1} placeholder="Role line 1" onChange={(e) => setRoleLine1(e.target.value)} />
        <input className="input" value={roleLine2} placeholder="Role line 2" onChange={(e) => setRoleLine2(e.target.value)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
          {signature ? `Signature: ${signature.name}` : "Choose signature (PNG, optional)"}
          <input
            type="file"
            accept="image/png"
            className="hidden"
            onChange={(e) => setSignature(e.target.files?.[0] ?? null)}
          />
        </label>
        <Button loading={add.isPending} disabled={name.trim().length < 2} onClick={submit}>
          <Plus className="h-4 w-4" /> Add signatory
        </Button>
      </div>
    </div>
  );
}

/** The pool of people whose signature can be printed on certificates (per-course selection). */
function SignatoriesCard() {
  const { settings, isLoading } = useSettings();
  const signatories = settings.certificate?.signatories ?? [];

  return (
    <div className="card mt-6 p-5">
      <div className="flex items-center gap-2">
        <PenLine className="h-5 w-5 text-amber-600" />
        <div>
          <p className="font-semibold text-ink-900">Certificate signatories</p>
          <p className="text-xs text-ink-400">
            The people whose signature can appear on completion certificates. Each course picks up to three of
            them (in the course builder → Completion certificate); courses with no selection use the first
            signatory. Signatures are background-less (transparent) <b>PNG only</b> · roughly 3:1
            width-to-height looks best · max 10MB.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          signatories.map((s) => <SignatoryRow key={s._id} signatory={s} canDelete={signatories.length > 1} />)
        )}
        <AddSignatoryForm />
      </div>

      <p className="mt-4 flex items-start gap-1.5 rounded-lg border border-ink-100 bg-ink-50/60 p-3 text-xs text-ink-500">
        <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
        Every issued certificate carries a QR code. Scanning it opens the public verification page, which shows
        only the certificate ID, student name, course name, course ID and generation date. The certificate date
        and serial number are auto-generated in Kenya time — IDs run OGR-&lt;year&gt;-0001 and the year rolls
        over automatically.
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

      <SignatoriesCard />

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
                    <a href={`/verify/${encodeURIComponent(c.certificateId)}`} target="_blank" rel="noreferrer" title="Open the public verification page" className="hover:text-teal-600 hover:underline">
                      {c.certificateId}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{c.studentName ?? "—"}</div>
                    {c.studentEmail && <div className="text-xs text-ink-400">{c.studentEmail}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{c.courseName}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-500">
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
