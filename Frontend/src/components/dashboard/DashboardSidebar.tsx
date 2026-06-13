"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BookOpen, CheckCircle2, Home, LogOut, BadgeCheck, Globe, User, Receipt } from "lucide-react";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type DashView = "my" | "completed" | "profile" | "purchases";

export function DashboardSidebar({ view, setView }: { view: DashView; setView: (v: DashView) => void }) {
  const router = useRouter();
  const account = useAuth((s) => s.account);
  const clearAuth = useAuth((s) => s.clearAuth);
  const [confirming, setConfirming] = useState(false);

  const isMember = account?.source === "member";

  const doLogout = () => {
    clearAuth();
    toast.success("Signed out");
    router.replace("/");
  };

  const items: { key: DashView; label: string; icon: typeof BookOpen }[] = [
    { key: "my", label: "My courses", icon: BookOpen },
    { key: "completed", label: "Completed courses", icon: CheckCircle2 },
    { key: "purchases", label: "Purchase history", icon: Receipt },
    { key: "profile", label: "My profile", icon: User },
  ];

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-72">
      {/* User info */}
      <div className="card overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-brand-600 to-grape-600" />
        <div className="px-4 pb-4">
          <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-brand-100 text-2xl font-extrabold text-brand-700">
            {account?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <h2 className="mt-2 font-bold text-ink-900">{account?.name}</h2>
          <p className="truncate text-xs text-ink-400">{account?.email}</p>
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

      {/* Nav */}
      <nav className="card space-y-1 p-2">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              view === key ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
        <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
          <Home className="h-4 w-4" /> Back to home
        </Link>
        <button
          onClick={() => setConfirming(true)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ball-600 hover:bg-ball-50"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </nav>

      {/* Logout confirmation */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirming(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ball-50">
              <LogOut className="h-6 w-6 text-ball-600" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-ink-900">Log out?</h3>
            <p className="mt-1 text-sm text-ink-500">You&apos;ll need to sign in again to access your courses.</p>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={doLogout}>Log out</Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
