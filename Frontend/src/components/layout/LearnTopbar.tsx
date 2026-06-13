"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronDown, LayoutDashboard, Home, LogOut, User } from "lucide-react";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

/**
 * Slim top bar for the learning experience: brand on the left, and on the right
 * just the signed-in user's name with a dropdown (dashboard / home / logout).
 * No marketing links by design.
 */
export function LearnTopbar() {
  const router = useRouter();
  const account = useAuth((s) => s.account);
  const clearAuth = useAuth((s) => s.clearAuth);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const dashHref = account?.kind === "admin" ? "/admin" : "/dashboard";

  const doLogout = () => {
    clearAuth();
    toast.success("Signed out");
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/logo.png" alt="Cricket Academy" width={32} height={32} />
          <span className="font-extrabold text-ink-900">Cricket Academy</span>
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-1.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-grape-600 text-xs font-bold text-white">
              {account?.name?.charAt(0).toUpperCase() ?? <User className="h-3.5 w-3.5" />}
            </span>
            <span className="max-w-[140px] truncate">{account?.name ?? "Account"}</span>
            <ChevronDown className={cn("h-4 w-4 text-ink-400 transition", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
              <div className="border-b border-ink-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-ink-900">{account?.name}</p>
                <p className="truncate text-xs text-ink-400">{account?.email}</p>
              </div>
              <Link
                href={dashHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                <LayoutDashboard className="h-4 w-4 text-ink-400" /> Dashboard
              </Link>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                <Home className="h-4 w-4 text-ink-400" /> Home
              </Link>
              <button
                onClick={doLogout}
                className="flex w-full items-center gap-2 border-t border-ink-100 px-4 py-2.5 text-sm font-medium text-ball-600 hover:bg-ball-50"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
