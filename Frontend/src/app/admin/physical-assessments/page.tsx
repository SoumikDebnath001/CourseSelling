"use client";

import { useState } from "react";
import { ClipboardCheck, Award, Phone, CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  usePhysicalAssessmentApplications,
  useApproveForTest,
  useApproveForCertificate,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import type { PhysicalAssessmentApplication } from "@/types/api";

export default function PhysicalAssessmentsPage() {
  const [filter, setFilter] = useState<"pending" | "approved">("pending");
  const { data: applications, isLoading } = usePhysicalAssessmentApplications(filter);

  return (
    <AdminShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Physical Assessment Applications</h1>
          <p className="mt-1 text-sm text-ink-400">Students who applied to sit an offline assessment to unlock a certificate.</p>
        </div>
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
  const approveTest = useApproveForTest();
  const approveCert = useApproveForCertificate();

  const testDone = a.status === "test_approved" || a.status === "cert_approved";
  const certDone = a.status === "cert_approved";

  return (
    <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink-900">{a.studentName}</h3>
          <StatusBadge status={a.status} />
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
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          variant={testDone ? "ghost" : "primary"}
          disabled={testDone}
          loading={approveTest.isPending}
          onClick={() => approveTest.mutate(a._id)}
        >
          {testDone ? <><CheckCircle2 className="h-4 w-4" /> Test approved</> : <><ClipboardCheck className="h-4 w-4" /> Approve for test</>}
        </Button>
        <Button
          variant={certDone ? "ghost" : "primary"}
          disabled={certDone}
          loading={approveCert.isPending}
          onClick={() => approveCert.mutate(a._id)}
        >
          {certDone ? <><CheckCircle2 className="h-4 w-4" /> Certificate approved</> : <><Award className="h-4 w-4" /> Approve for certificate</>}
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PhysicalAssessmentApplication["status"] }) {
  const map = {
    pending: { label: "Pending", cls: "bg-ink-100 text-ink-500" },
    test_approved: { label: "Approved for test", cls: "bg-sun-400/20 text-sun-500" },
    cert_approved: { label: "Certificate approved", cls: "bg-pitch-100 text-pitch-700" },
  } as const;
  const s = map[status];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", s.cls)}>{s.label}</span>;
}
