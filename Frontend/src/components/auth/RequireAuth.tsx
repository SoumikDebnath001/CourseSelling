"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type AuthKind } from "@/store/auth";
import { FullScreenSpinner } from "@/components/ui/Spinner";

/**
 * Client-side route guard. Redirects to the correct login if there's no session,
 * or home if the session is the wrong kind. Waits for the persisted store to
 * hydrate before deciding to avoid a flash-redirect on refresh.
 */
export function RequireAuth({ kind, children }: { kind?: AuthKind; children: ReactNode }) {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const account = useAuth((s) => s.account);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      router.replace(kind === "admin" ? "/admin/login" : "/login");
    } else if (kind && account?.kind !== kind) {
      router.replace(account?.kind === "admin" ? "/admin" : "/dashboard");
    }
  }, [mounted, token, account, kind, router]);

  if (!mounted || !token || (kind && account?.kind !== kind)) {
    return <FullScreenSpinner />;
  }
  return <>{children}</>;
}
