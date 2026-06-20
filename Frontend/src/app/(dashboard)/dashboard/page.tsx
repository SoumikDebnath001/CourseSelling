"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, CheckCircle2, BadgeCheck, Globe, Mail, User as UserIcon, Receipt, Download, Award, Trophy, Layers, ChevronLeft, ChevronRight, Target, X } from "lucide-react";
import { gsap } from "gsap";
import { AccountBar } from "@/components/layout/AccountBar";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardSidebar, type DashView } from "@/components/dashboard/DashboardSidebar";
import { useMyEnrolledCourses, useMyTransactions } from "@/hooks/useLearn";
import { useMyProgression, useMyCertificates } from "@/hooks/useProgression";
import { useAuth, type AuthAccount } from "@/store/auth";
import { Spinner } from "@/components/ui/Spinner";
import { generateCertificate } from "@/lib/certificate";
import { formatKES } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { EnrolledCourse, Transaction, CategoryProgress } from "@/types/api";

function DashboardInner() {
  const { data: courses, isLoading } = useMyEnrolledCourses();
  const [view, setView] = useState<DashView>("my");

  const completed = (courses ?? []).filter((c) => c.percent >= 100);
  const inProgress = (courses ?? []).filter((c) => c.percent < 100);
  const shown = view === "completed" ? completed : inProgress;

  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // GSAP animation for mobile sidebar slide-in
  useEffect(() => {
    if (isSidebarOpen) {
      gsap.to(overlayRef.current, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(sidebarRef.current, { x: 0, duration: 0.4, ease: "power3.out" });
      document.body.style.overflow = "hidden"; 
    } else {
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.3, ease: "power2.in" });
      gsap.to(sidebarRef.current, { x: "-100%", duration: 0.4, ease: "power3.in" });
      document.body.style.overflow = ""; 
    }
    return () => { document.body.style.overflow = ""; };
  }, [isSidebarOpen]);

  const heading =
    view === "completed"
      ? "Completed courses"
      : view === "certifications"
        ? "My certifications"
        : view === "profile"
          ? "My profile"
          : view === "purchases"
            ? "Purchase history"
            : "My courses";
  const subheading =
    view === "completed"
      ? "Courses you've finished — well played."
      : view === "certifications"
        ? "Download certificates for courses you've fully completed — filter by category, level and date."
        : view === "profile"
          ? "Your account details and learning at a glance."
          : view === "purchases"
            ? "Your past course transactions and invoices."
            : "Keep going where you left off.";

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col relative">
      <AccountBar home="/dashboard" hideLogout={true} onMenuClick={() => setIsSidebarOpen(true)} />
      
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6 flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-72 shrink-0">
          <DashboardSidebar view={view} setView={setView} />
        </div>

        <main className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-ink-900">{heading}</h1>
          <p className="mt-1 text-sm text-ink-500">{subheading}</p>

          {view === "profile" ? (
            <ProfilePanel total={courses?.length ?? 0} completed={completed.length} inProgress={inProgress.length} />
          ) : view === "purchases" ? (
            <PurchaseHistoryPanel />
          ) : view === "certifications" ? (
            <CertificationsPanel />
          ) : isLoading ? (
            <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
          ) : (
            <>
              {view === "my" && <ProgressAchievement />}
              {shown.length > 0 ? (
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {shown.map((c) => <DashCourseCard key={c.course._id} data={c} />)}
                </div>
              ) : (
                <EmptyCourses view={view} />
              )}
            </>
          )}
        </main>
      </div>

      {/* ───────── Mobile Sidebar Overlay ───────── */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 z-[60] bg-ink-900/40 backdrop-blur-sm invisible opacity-0 lg:hidden"
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ───────── Mobile Sidebar ───────── */}
      <div 
        ref={sidebarRef}
        className="fixed top-0 left-0 z-[70] h-[100dvh] w-80 bg-ink-50 shadow-2xl -translate-x-full lg:hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 bg-white">
          <span className="font-extrabold text-ink-900">Dashboard Menu</span>
          <button 
            className="p-2 text-ink-500 hover:text-brand-600 hover:bg-ink-100 rounded-full transition-colors focus:outline-none"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 pb-8">
          <DashboardSidebar 
            view={view} 
            setView={(v) => {
              setView(v);
              setIsSidebarOpen(false);
            }} 
          />
        </div>
      </div>
    </div>
  );
}

function EmptyCourses({ view }: { view: DashView }) {
  return (
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
  return formatKES(amount);
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
      <div class="row"><span>Tax</span><span>KES 0</span></div>
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

/** Top of "My courses": overall totals + an auto-rotating per-category progress carousel. */
function ProgressAchievement() {
  const { data: prog, isLoading } = useMyProgression();
  if (isLoading || !prog) return null;

  const totals = [
    { label: "Total points", value: prog.totalPoints, icon: Trophy },
    { label: "Courses completed", value: prog.coursesCompleted, icon: CheckCircle2 },
    { label: "Certificates", value: prog.certificatesEarned, icon: Award },
  ];

  return (
    <section className="mt-5 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {totals.map((t) => (
          <div key={t.label} className="card flex flex-col items-center p-4 text-center">
            <t.icon className="h-5 w-5 text-brand-600" />
            <div className="mt-1 text-2xl font-extrabold text-ink-900">{t.value}</div>
            <div className="text-[11px] font-medium text-ink-500">{t.label}</div>
          </div>
        ))}
      </div>
      {prog.categories.length > 0 ? (
        <CategoryCarousel categories={prog.categories} />
      ) : (
        <div className="card p-6 text-center text-sm text-ink-500">
          <Target className="mx-auto h-7 w-7 text-ink-300" />
          <p className="mt-2">Start a Foundation course to begin building your level in a category.</p>
        </div>
      )}
    </section>
  );
}

/** Auto-rotating cards (one per category) with prev/next buttons + mobile swipe. */
function CategoryCarousel({ categories }: { categories: CategoryProgress[] }) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = categories.length;
  const go = (n: number) => setIdx((p) => (n + count) % count);

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);

  const c = categories[Math.min(idx, count - 1)];

  return (
    <div
      className="relative"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx > 40) go(idx - 1);
        else if (dx < -40) go(idx + 1);
        touchX.current = null;
      }}
    >
      <CategoryProgressCard c={c} />
      {count > 1 && (
        <>
          <button
            aria-label="Previous"
            onClick={() => go(idx - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-ink-700 shadow ring-1 ring-ink-200 hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next"
            onClick={() => go(idx + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-ink-700 shadow ring-1 ring-ink-200 hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="mt-3 flex justify-center gap-1.5">
            {categories.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to card ${i + 1}`}
                onClick={() => setIdx(i)}
                className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-5 bg-brand-600" : "w-1.5 bg-ink-200")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CategoryProgressCard({ c }: { c: CategoryProgress }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-grape-600 px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          <div>
            <div className="text-sm font-bold">{c.category?.name ?? "Category"}</div>
            <div className="text-[11px] uppercase tracking-wide opacity-80">{c.currentLevelName}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold">{c.points}</div>
          <div className="text-[11px] uppercase tracking-wide opacity-80">Points</div>
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between text-xs font-medium text-ink-500">
          <span>{c.nextLevel ? `Progress to ${c.nextLevel.name}` : "Top level reached 🎉"}</span>
          {c.nextLevel && (
            <span className="font-semibold text-ink-700">{c.points}/{c.nextLevel.unlockPoints} pts</span>
          )}
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-grape-500 transition-all" style={{ width: `${c.percent}%` }} />
        </div>
        {c.nextLevel ? (
          <p className="mt-2 text-xs text-ink-400">
            {c.percent}% · {c.pointsToNext} more point{c.pointsToNext === 1 ? "" : "s"} to unlock {c.nextLevel.name}.
          </p>
        ) : (
          <p className="mt-2 text-xs text-ink-400">You&apos;ve reached the highest level in this category.</p>
        )}
      </div>
    </div>
  );
}

function CertificationsPanel() {
  const account = useAuth((s) => s.account);
  const { data: certs, isLoading } = useMyCertificates();
  const { data: prog } = useMyProgression();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sortNewest, setSortNewest] = useState(true);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>;
  }

  const all = certs ?? [];
  const levels = prog?.levels ?? [];
  const levelName = (key: string) => {
    const l = levels.find((x) => x.key === key);
    return l?.label || l?.name || key;
  };

  const categories = Array.from(
    new Map(all.filter((c) => c.category).map((c) => [c.category!._id, c.category!])).values()
  );
  const levelKeys = Array.from(new Set(all.map((c) => c.level)));

  const filtered = all
    .filter((c) => categoryFilter === "all" || c.category?._id === categoryFilter)
    .filter((c) => levelFilter === "all" || c.level === levelFilter)
    .sort((a, b) =>
      sortNewest
        ? +new Date(b.issuedAt) - +new Date(a.issuedAt)
        : +new Date(a.issuedAt) - +new Date(b.issuedAt)
    );

  if (all.length === 0) {
    return (
      <div className="card mt-5 p-10 text-center">
        <Award className="mx-auto h-8 w-8 text-ink-300" />
        <p className="mt-2 text-ink-500">No certificates yet — fully complete a course (all lessons + final test) to earn one.</p>
        <Link href="/catalog" className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-brand-600 to-grape-600 px-4 py-2 text-sm font-semibold text-white">
          Explore courses
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input h-9 w-auto py-1 text-sm">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="input h-9 w-auto py-1 text-sm">
          <option value="all">All levels</option>
          {levelKeys.map((k) => (
            <option key={k} value={k}>{levelName(k)}</option>
          ))}
        </select>
        <button
          onClick={() => setSortNewest((s) => !s)}
          className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
        >
          Date: {sortNewest ? "Newest" : "Oldest"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((c) => (
          <div key={c._id} className="card flex items-center gap-4 p-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: c.certificateColor || "#4f46e5" }}
            >
              <Award className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 font-semibold text-ink-900">{c.courseName}</h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                {c.categoryName && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 font-bold text-brand-700">{c.categoryName}</span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-sun-100 px-2 py-0.5 font-bold text-sun-700">
                  <Layers className="h-3 w-3" /> {levelName(c.level)}
                </span>
                <span className="text-ink-400">{formatDate(c.issuedAt)}</span>
              </div>
            </div>
            <button
              onClick={() =>
                generateCertificate({
                  studentName: account?.name ?? "Student",
                  courseName: c.courseName,
                  color: c.certificateColor,
                  date: new Date(c.issuedAt),
                })
              }
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
            >
              <Download className="h-3.5 w-3.5" /> Certificate
            </button>
          </div>
        ))}
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
