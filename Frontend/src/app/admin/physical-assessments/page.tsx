"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Calendar, Phone, QrCode, ScanLine, ShieldOff, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { QrScannerModal } from "@/components/admin/QrScannerModal";
import {
  usePhysicalAssessmentApplications,
  useScheduleAssessment,
  useToggleRevoke,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import type { PhysicalAssessmentApplication } from "@/types/api";

/** Pulls the `/admin/physical-assessments/verify/:id?token=...` path out of a scanned QR URL. */
function verifyPathFromScan(text: string): string | null {
  try {
    const url = new URL(text);
    if (!url.pathname.includes("/admin/physical-assessments/verify/")) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

export default function PhysicalAssessmentsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"pending" | "approved">("pending");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const { data: applications, isLoading } = usePhysicalAssessmentApplications(filter);

  const handleDetect = (text: string) => {
    const path = verifyPathFromScan(text);
    if (!path) {
      setScanError("That QR code isn't a check-in code for this platform.");
      return;
    }
    setScanning(false);
    router.push(path);
  };

  return (
    <AdminShell>
      {scanning && (
        <QrScannerModal
          onClose={() => setScanning(false)}
          onDetect={handleDetect}
        />
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Physical Assessment Applications</h1>
          <p className="mt-1 text-sm text-ink-400">Students who applied to sit an offline assessment to unlock a certificate.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setScanError(null);
              setScanning(true);
            }}
          >
            <ScanLine className="h-4 w-4" /> Scan QR
          </Button>
          {/* Not approved / Approved toggle slider */}
          <div className="relative grid shrink-0 grid-cols-2 rounded-full bg-ink-100 p-1 text-sm font-semibold">
          {/* Indicator is sized to half the inner track (50% minus the p-1 padding) so it
              lines up exactly under each button instead of overflowing. */}
          <span
            className={cn(
              "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-transform duration-200",
              filter === "approved" && "translate-x-full"
            )}
          />
          <button
            onClick={() => setFilter("pending")}
            className={cn("relative z-10 rounded-full px-4 py-1.5 transition-colors sm:px-6", filter === "pending" ? "text-ink-900" : "text-ink-400")}
          >
            Not approved
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={cn("relative z-10 rounded-full px-4 py-1.5 transition-colors sm:px-6", filter === "approved" ? "text-ink-900" : "text-ink-400")}
          >
            Approved
          </button>
          </div>
        </div>
      </div>

      {scanError && (
        <p className="mt-3 rounded-lg bg-ball-50 px-3 py-2 text-sm text-ball-700">{scanError}</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
      ) : applications && applications.length > 0 ? (
        <div className="mt-5 space-y-3">
          {applications.map((a) => (
            <ApplicationRow key={a._id} application={a} />
          ))}
        </div>
      ) : (
        <div className="card mt-5 p-10 text-center">
          <ClipboardCheck className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-2 text-ink-500">No {filter === "approved" ? "approved" : "pending"} applications.</p>
        </div>
      )}
    </AdminShell>
  );
}

function ApplicationRow({ application: a }: { application: PhysicalAssessmentApplication }) {
  const schedule = useScheduleAssessment();
  const toggleRevoke = useToggleRevoke();
  const [scheduling, setScheduling] = useState(false);
  const [date, setDate] = useState("");

  const confirmSchedule = () => {
    if (!date) return;
    schedule.mutate({ id: a._id, scheduledDate: new Date(date).toISOString() }, { onSuccess: () => setScheduling(false) });
  };

  return (
    <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink-900">{a.studentName}</h3>
          <StatusBadge status={a.status} />
          {a.revoked && <span className="rounded-full bg-ball-100 px-2 py-0.5 text-xs font-semibold text-ball-700">Revoked</span>}
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-500">
          {a.course?.courseName ?? "—"} · {a.levelLabel} {a.scope === "section" ? "section" : "course"}
        </p>
        <a
          href={`https://wa.me/${(a.whatsappCountryCode + a.whatsappNumber).replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-pitch-700 hover:underline"
        >
          <Phone className="h-3.5 w-3.5" /> {a.whatsappCountryCode} {a.whatsappNumber}
        </a>
        {a.status === "scheduled" && a.scheduledDate && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
            <Calendar className="h-3.5 w-3.5" /> {new Date(a.scheduledDate).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            {a.otpVerifiedAt && " · checked in"}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {a.status === "pending" && !a.revoked && (
          scheduling ? (
            <>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input py-1.5 text-sm"
              />
              <Button loading={schedule.isPending} disabled={!date} onClick={confirmSchedule}>Confirm date</Button>
              <Button variant="ghost" onClick={() => setScheduling(false)}>Cancel</Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setScheduling(true)}>
              <Calendar className="h-4 w-4" /> Schedule
            </Button>
          )
        )}

        {a.status === "scheduled" && !a.revoked && (
          <Link
            href={`/admin/physical-assessments/verify/${a._id}?token=${a.qrToken ?? ""}`}
            className="inline-flex items-center gap-2 rounded-xl bg-pitch-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pitch-700"
          >
            <QrCode className="h-4 w-4" /> Open verification
          </Link>
        )}

        {a.status !== "cert_approved" && (
          <Button
            variant="ghost"
            loading={toggleRevoke.isPending}
            onClick={() => toggleRevoke.mutate({ id: a._id, revoked: !a.revoked })}
          >
            {a.revoked ? <><ShieldCheck className="h-4 w-4" /> Un-revoke</> : <><ShieldOff className="h-4 w-4" /> Revoke</>}
          </Button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PhysicalAssessmentApplication["status"] }) {
  const map = {
    pending: { label: "Pending", cls: "bg-ink-100 text-ink-500" },
    scheduled: { label: "Scheduled", cls: "bg-sun-400/20 text-sun-500" },
    cert_approved: { label: "Certificate approved", cls: "bg-pitch-100 text-pitch-700" },
    failed: { label: "Not passed", cls: "bg-ball-100 text-ball-700" },
  } as const;
  const s = map[status];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", s.cls)}>{s.label}</span>;
}
