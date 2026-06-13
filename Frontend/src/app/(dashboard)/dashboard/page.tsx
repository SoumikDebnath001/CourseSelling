"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, CheckCircle2, BadgeCheck, Globe, Mail, User as UserIcon, Receipt, Download } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardSidebar, type DashView } from "@/components/dashboard/DashboardSidebar";
import { useMyEnrolledCourses, useMyTransactions } from "@/hooks/useLearn";
import { useAuth, type AuthAccount } from "@/store/auth";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import type { EnrolledCourse, Transaction } from "@/types/api";

function DashboardInner() {
  const { data: courses, isLoading } = useMyEnrolledCourses();
  const [view, setView] = useState<DashView>("my");

  const completed = (courses ?? []).filter((c) => c.percent >= 100);
  const inProgress = (courses ?? []).filter((c) => c.percent < 100);
  const shown = view === "completed" ? completed : inProgress;

  const heading =
    view === "completed"
      ? "Completed courses"
      : view === "profile"
        ? "My profile"
        : view === "purchases"
          ? "Purchase history"
          : "My courses";
  const subheading =
    view === "completed"
      ? "Courses you've finished — well played."
      : view === "profile"
        ? "Your account details and learning at a glance."
        : view === "purchases"
          ? "Your past course transactions and invoices."
          : "Keep going where you left off.";

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <DashboardSidebar view={view} setView={setView} />

        <main className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-ink-900">{heading}</h1>
          <p className="mt-1 text-sm text-ink-500">{subheading}</p>

          {view === "profile" ? (
            <ProfilePanel total={courses?.length ?? 0} completed={completed.length} inProgress={inProgress.length} />
          ) : view === "purchases" ? (
            <PurchaseHistoryPanel />
          ) : isLoading ? (
            <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
          ) : shown.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {shown.map((c) => <DashCourseCard key={c.course._id} data={c} />)}
            </div>
          ) : (
            <div className="card mt-5 p-10 text-center">
              {view === "completed" ? (
                <>
                  <CheckCircle2 className="mx-auto h-8 w-8 text-ink-300" />
                  <p className="mt-2 text-ink-500">No completed courses yet — finish one to see it here.</p>
                </>
              ) : (
                <>
                  <BookOpen className="mx-auto h-8 w-8 text-ink-300" />
                  <p className="mt-2 text-ink-500">You haven&apos;t enrolled in any courses yet.</p>
                  <Link href="/catalog" className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-brand-600 to-grape-600 px-4 py-2 text-sm font-semibold text-white">
                    Explore courses
                  </Link>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ProfilePanel({ total, completed, inProgress }: { total: number; completed: number; inProgress: number }) {
  const account = useAuth((s) => s.account);
  const isMember = account?.source === "member";

  const stats = [
    { label: "Enrolled", value: total },
    { label: "In progress", value: inProgress },
    { label: "Completed", value: completed },
  ];

  return (
    <div className="mt-5 space-y-5">
      {/* Identity card */}
      <div className="card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-brand-600 to-grape-600" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-brand-100 text-3xl font-extrabold text-brand-700">
            {account?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <h2 className="mt-3 text-xl font-bold text-ink-900">{account?.name}</h2>
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              isMember ? "bg-pitch-100 text-pitch-700" : "bg-brand-100 text-brand-700"
            )}
          >
            {isMember ? <BadgeCheck className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
            {isMember ? "Academy member" : "Online learner"}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="card divide-y divide-ink-100">
        <ProfileRow icon={UserIcon} label="Name" value={account?.name ?? "—"} />
        <ProfileRow icon={Mail} label="Email" value={account?.email ?? "—"} />
        <ProfileRow
          icon={isMember ? BadgeCheck : Globe}
          label="Account type"
          value={isMember ? "Academy member" : "Online learner"}
        />
        {account?.role && <ProfileRow icon={BadgeCheck} label="Role" value={account.role} />}
      </div>

      {/* Learning stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl font-extrabold text-ink-900">{s.value}</div>
            <div className="mt-1 text-xs font-medium text-ink-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PurchaseHistoryPanel() {
  const { data: transactions, isLoading } = useMyTransactions();
  const account = useAuth((s) => s.account);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="card mt-5 p-10 text-center">
        <Receipt className="mx-auto h-8 w-8 text-ink-300" />
        <p className="mt-2 text-ink-500">No purchases yet — your transactions will appear here.</p>
        <Link href="/catalog" className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-brand-600 to-grape-600 px-4 py-2 text-sm font-semibold text-white">
          Explore courses
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      {/* Desktop table */}
      <div className="card hidden overflow-hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-semibold">Invoice</th>
              <th className="px-4 py-3 font-semibold">Course</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-ink-50/60">
                <td className="px-4 py-3 font-mono text-xs text-ink-500">{t.invoiceNo}</td>
                <td className="px-4 py-3 font-medium text-ink-900">{t.course.courseName}</td>
                <td className="px-4 py-3 text-ink-500">{formatDate(t.date)}</td>
                <td className="px-4 py-3 font-semibold text-ink-900">{formatAmount(t.amountPaid)}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => downloadInvoice(t, account)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {transactions.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-ink-900">{t.course.courseName}</h3>
                <p className="mt-0.5 font-mono text-xs text-ink-400">{t.invoiceNo}</p>
              </div>
              <StatusBadge status={t.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-ink-500">{formatDate(t.date)}</span>
              <span className="font-semibold text-ink-900">{formatAmount(t.amountPaid)}</span>
            </div>
            <button
              onClick={() => downloadInvoice(t, account)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
            >
              <Download className="h-3.5 w-3.5" /> Download invoice
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Transaction["status"] }) {
  const active = status === "active";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        active ? "bg-pitch-100 text-pitch-700" : "bg-ink-100 text-ink-500"
      )}
    >
      {active ? "Paid" : "Cancelled"}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(amount: number) {
  return amount > 0 ? `₹${amount.toLocaleString("en-IN")}` : "Free";
}

/** Builds a printable invoice in a new window so the browser can save it as PDF. */
function downloadInvoice(t: Transaction, account: AuthAccount | null) {
  const win = window.open("", "_blank", "width=820,height=900");
  if (!win) return;

  const amount = formatAmount(t.amountPaid);
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${t.invoiceNo}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1f2430; margin: 0; padding: 48px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ecedf1; padding-bottom: 24px; }
  .brand { font-size: 22px; font-weight: 800; }
  .brand small { display: block; font-size: 12px; font-weight: 500; color: #8a90a0; margin-top: 4px; }
  .inv { text-align: right; }
  .inv h1 { font-size: 20px; margin: 0 0 6px; letter-spacing: .5px; }
  .inv p { margin: 2px 0; font-size: 13px; color: #6b7280; }
  .meta { display: flex; justify-content: space-between; margin-top: 28px; font-size: 13px; }
  .meta h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #8a90a0; margin: 0 0 6px; }
  .meta p { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 32px; font-size: 14px; }
  th { text-align: left; background: #f6f7f9; padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; }
  td { padding: 14px 12px; border-bottom: 1px solid #ecedf1; }
  .right { text-align: right; }
  .total { display: flex; justify-content: flex-end; margin-top: 24px; }
  .total .box { width: 240px; }
  .total .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
  .total .grand { border-top: 2px solid #1f2430; margin-top: 6px; padding-top: 12px; font-size: 16px; font-weight: 800; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: ${t.status === "active" ? "#e6f7ec;color:#15803d" : "#eef0f3;color:#6b7280"}; }
  footer { margin-top: 56px; border-top: 1px solid #ecedf1; padding-top: 16px; font-size: 12px; color: #8a90a0; text-align: center; }
  @media print { body { padding: 24px; } .noprint { display: none; } }
</style>
</head>
<body>
  <div class="head">
    <div class="brand">🏏 Cricket Academy<small>Online Courses</small></div>
    <div class="inv">
      <h1>INVOICE</h1>
      <p>${t.invoiceNo}</p>
      <p>${formatDate(t.date)}</p>
      <p><span class="badge">${t.status === "active" ? "PAID" : "CANCELLED"}</span></p>
    </div>
  </div>

  <div class="meta">
    <div>
      <h3>Billed to</h3>
      <p><strong>${escapeHtml(account?.name ?? "Student")}</strong></p>
      <p>${escapeHtml(account?.email ?? "")}</p>
    </div>
    <div class="right">
      <h3>Payment reference</h3>
      <p>${escapeHtml(t.paymentRef)}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th class="right">Amount</th></tr>
    </thead>
    <tbody>
      <tr><td>${escapeHtml(t.course.courseName)}</td><td class="right">${amount}</td></tr>
    </tbody>
  </table>

  <div class="total">
    <div class="box">
      <div class="row"><span>Subtotal</span><span>${amount}</span></div>
      <div class="row"><span>Tax</span><span>₹0</span></div>
      <div class="row grand"><span>Total</span><span>${amount}</span></div>
    </div>
  </div>

  <footer>Thank you for learning with Cricket Academy. This is a computer-generated invoice.</footer>

  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function ProfileRow({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-ink-400">{label}</div>
        <div className="truncate text-sm font-semibold text-ink-900">{value}</div>
      </div>
    </div>
  );
}

function DashCourseCard({ data }: { data: EnrolledCourse }) {
  const { course, percent, completedTopics, totalTopics } = data;
  return (
    <Link href={`/learn/${course._id}`} className="card overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-video bg-ink-100">
        {course.thumbnail?.url ? (
          <Image src={course.thumbnail.url} alt={course.courseName} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image src="/brand/ball.png" alt="" width={40} height={40} className="opacity-40" />
          </div>
        )}
        {percent >= 100 && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-pitch-600 px-2 py-0.5 text-xs font-semibold text-white">
            <CheckCircle2 className="h-3.5 w-3.5" /> Done
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-ink-900">{course.courseName}</h3>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full bg-gradient-to-r from-brand-500 to-grape-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-ink-400">
          <span>{completedTopics}/{totalTopics} topics</span>
          <span className="flex items-center gap-1 font-semibold text-brand-700">
            {percent >= 100 ? "Review" : "Continue"} <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth kind="user">
      <DashboardInner />
    </RequireAuth>
  );
}
