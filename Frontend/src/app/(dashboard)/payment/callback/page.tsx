"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { fetchPaymentStatus, PaymentStatusResult } from "@/hooks/useEnroll";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatKES } from "@/lib/currency";

/**
 * Pesapal sends the payer's browser back here with ?OrderTrackingId=…
 * The query params prove nothing — this page asks OUR backend, which verifies
 * the outcome with Pesapal server-to-server before granting access.
 */
function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const account = useAuth((s) => s.account);
  const orderTrackingId = params.get("OrderTrackingId");

  const [payment, setPayment] = useState<PaymentStatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attempts = useRef(0);

  useEffect(() => {
    if (!orderTrackingId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const result = await fetchPaymentStatus(orderTrackingId);
        if (cancelled) return;
        setPayment(result);
        if (result.status === "paid") {
          qc.invalidateQueries({ queryKey: ["course"] });
          qc.invalidateQueries({ queryKey: ["my-courses"] });
        } else if (result.status === "pending" && attempts.current < 10) {
          // M-Pesa confirmations can lag a few seconds behind the redirect.
          attempts.current += 1;
          timer = setTimeout(poll, 3000);
        }
      } catch {
        if (!cancelled) setError("Could not verify the payment. Please check My Courses in a minute.");
      }
    };
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderTrackingId, qc]);

  if (!account) {
    return (
      <CallbackShell>
        <p className="text-ink-600">Please sign in to see your payment result.</p>
        <Button className="mt-4" onClick={() => router.push("/login")}>Sign in</Button>
      </CallbackShell>
    );
  }

  if (!orderTrackingId) {
    return (
      <CallbackShell>
        <XCircle className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-3 font-bold text-ink-900">Missing payment reference</p>
        <Link href="/courses" className="mt-4 inline-block text-sm font-semibold text-brand-600">Browse courses</Link>
      </CallbackShell>
    );
  }

  if (error) {
    return (
      <CallbackShell>
        <XCircle className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-3 font-bold text-ink-900">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
      </CallbackShell>
    );
  }

  if (!payment || (payment.status === "pending" && attempts.current < 10)) {
    return (
      <CallbackShell>
        <Spinner className="mx-auto h-8 w-8" />
        <p className="mt-4 font-bold text-ink-900">Confirming your payment…</p>
        <p className="mt-1 text-sm text-ink-500">This usually takes a few seconds. Don&apos;t close this page.</p>
      </CallbackShell>
    );
  }

  if (payment.status === "paid") {
    return (
      <CallbackShell>
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <p className="mt-3 text-lg font-extrabold text-ink-900">Payment successful!</p>
        <p className="mt-1 text-sm text-ink-600">
          You&apos;re enrolled in <span className="font-semibold">{payment.courseName ?? "your course"}</span>
          {" "}({formatKES(payment.amount)}).
        </p>
        {payment.confirmationCode && (
          <p className="mt-1 text-xs text-ink-400">Confirmation: {payment.confirmationCode}</p>
        )}
        <Button className="mt-5" onClick={() => router.push(`/learn/${payment.courseId}`)}>
          Start learning
        </Button>
      </CallbackShell>
    );
  }

  if (payment.status === "pending") {
    return (
      <CallbackShell>
        <Clock className="mx-auto h-10 w-10 text-sun-500" />
        <p className="mt-3 font-bold text-ink-900">Payment still processing</p>
        <p className="mt-1 text-sm text-ink-600">
          We&apos;ll grant access automatically as soon as Pesapal confirms it. Check My Courses shortly.
        </p>
        <Button className="mt-5" onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
      </CallbackShell>
    );
  }

  return (
    <CallbackShell>
      <XCircle className="mx-auto h-10 w-10 text-red-500" />
      <p className="mt-3 font-bold text-ink-900">Payment {payment.status === "reversed" ? "reversed" : "failed"}</p>
      <p className="mt-1 text-sm text-ink-600">You have not been charged for this enrollment.</p>
      {payment.courseSlug && (
        <Button className="mt-5" onClick={() => router.push(`/courses/${payment.courseSlug}`)}>
          Try again
        </Button>
      )}
    </CallbackShell>
  );
}

function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-24">
      <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-sm">{children}</div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex justify-center py-24">
          <Spinner className="h-8 w-8" />
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
