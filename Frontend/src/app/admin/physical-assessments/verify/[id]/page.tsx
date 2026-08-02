"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, ShieldX, Mail, RefreshCcw, Award, XCircle, Calendar } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useVerifyApplication, useSendOtp, useVerifyOtp, useRecordResult } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Reached two ways: an admin's phone camera scanning the QR emailed to the student, or the
 * "Open verification" link on the applications list. Auto-sends a check-in code to the
 * student's email once (they read it aloud in person); the admin types it in here to confirm
 * identity before the Passed/Not passed buttons unlock.
 */
function VerifyInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { data, isLoading, isError } = useVerifyApplication(id, token);
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();
  const recordResult = useRecordResult();
  const [otp, setOtp] = useState("");
  const autoSent = useRef(false);

  useEffect(() => {
    if (!data || autoSent.current) return;
    if (data.status === "scheduled" && !data.otpVerifiedAt && !data.revoked) {
      autoSent.current = true;
      sendOtp.mutate({ id, token });
    }
  }, [data, id, token, sendOtp]);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>;
  }

  if (isError || !data) {
    return (
      <div className="card mt-5 p-8 text-center">
        <ShieldX className="mx-auto h-8 w-8 text-ball-500" />
        <p className="mt-2 text-ink-600">This verification link is invalid or has expired.</p>
      </div>
    );
  }

  return (
    <div className="card mt-5 space-y-5 p-6">
      <div>
        <h2 className="text-lg font-bold text-ink-900">{data.studentName}</h2>
        <p className="text-sm text-ink-500">
          {data.course?.courseName ?? "—"} · {data.levelLabel} {data.scope === "section" ? "section" : "course"}
        </p>
        <p className="mt-1 text-sm text-ink-400">{data.whatsappCountryCode} {data.whatsappNumber}</p>
        {data.scheduledDate && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-400">
            <Calendar className="h-3.5 w-3.5" /> {new Date(data.scheduledDate).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        )}
      </div>

      {data.revoked ? (
        <p className="rounded-lg bg-ink-50 p-3 text-sm text-ink-500">This application has been revoked by an admin.</p>
      ) : data.status === "cert_approved" ? (
        <p className="flex items-center gap-2 rounded-lg bg-pitch-50 p-3 text-sm font-semibold text-pitch-700">
          <Award className="h-4 w-4" /> Passed — certificate unlocked.
        </p>
      ) : data.status === "failed" ? (
        <p className="flex items-center gap-2 rounded-lg bg-ball-50 p-3 text-sm font-semibold text-ball-700">
          <XCircle className="h-4 w-4" /> Marked as not passed. The student can request another attempt from their course page.
        </p>
      ) : data.status === "pending" ? (
        <p className="rounded-lg bg-ink-50 p-3 text-sm text-ink-500">This application hasn&apos;t been scheduled yet.</p>
      ) : !data.otpVerifiedAt ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-ink-600">
            <Mail className="h-4 w-4 shrink-0 text-pitch-600" /> A check-in code has been emailed to the student — ask them to read it aloud.
          </p>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="6-digit code"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              maxLength={8}
            />
            <Button loading={verifyOtp.isPending} disabled={otp.length < 4} onClick={() => verifyOtp.mutate({ id, token, otp })}>
              Verify
            </Button>
          </div>
          <Button variant="ghost" loading={sendOtp.isPending} onClick={() => sendOtp.mutate({ id, token })}>
            <RefreshCcw className="h-4 w-4" /> Resend code
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-pitch-700">
            <ShieldCheck className="h-4 w-4" /> Check-in verified — record the assessment result.
          </p>
          <div className="flex gap-3">
            <Button className="flex-1" loading={recordResult.isPending} onClick={() => recordResult.mutate({ id, passed: true })}>
              Passed
            </Button>
            <Button variant="ghost" className="flex-1" loading={recordResult.isPending} onClick={() => recordResult.mutate({ id, passed: false })}>
              Not passed
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell>
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-ink-900">Physical Assessment Check-in</h1>
        <Suspense fallback={<div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>}>
          <VerifyInner id={id} />
        </Suspense>
      </div>
    </AdminShell>
  );
}
