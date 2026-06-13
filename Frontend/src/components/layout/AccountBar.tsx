"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/store/auth";
import { useSettings } from "@/hooks/useSettings";

/** Top bar with brand, account name, and logout — used across dashboard/admin shells. */
export function AccountBar({ home = "/dashboard" }: { home?: string }) {
  const router = useRouter();
  const account = useAuth((s) => s.account);
  const clearAuth = useAuth((s) => s.clearAuth);
  const { settings } = useSettings();

  const logout = () => {
    clearAuth();
    toast.success("Signed out");
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={home} className="flex items-center gap-2">
          <Image src="/brand/logo.png" alt={settings.platformName} width={32} height={32} />
          <span className="font-bold text-ink-900">{settings.platformName}</span>
        </Link>
        <div className="flex items-center gap-3">
          {account && (
            <span className="hidden text-sm text-ink-600 sm:inline">
              {account.name}
              <span className="ml-2 rounded-full bg-pitch-100 px-2 py-0.5 text-xs font-semibold text-pitch-700">
                {account.kind === "admin" ? "Admin" : account.role ?? "Member"}
              </span>
            </span>
          )}
          <button onClick={logout} className="btn-ghost px-3 py-1.5 text-sm">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
