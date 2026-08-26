"use client";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuth } from "@/store/auth";
import type { LoginResponse } from "@/types/api";
import type { AuthAccount } from "@/store/auth";

function useLoginMutation() {
  const setAuth = useAuth((s) => s.setAuth);
  return (path: string) =>
    useMutation({
      mutationFn: async (body: Record<string, unknown>) => {
        const { data } = await api.post<LoginResponse>(path, body);
        return data;
      },
      onSuccess: (data) => setAuth(data.token, data.account),
    });
}

/** All auth actions for the user-facing auth page. */
export function useAuthActions() {
  const make = useLoginMutation();
  return {
    login: make("/auth/login"),
    register: useMutation({ mutationFn: (b: { name: string; email: string; password: string }) => api.post("/auth/register", b) }),
    verifyOtp: make("/auth/verify-otp"),
    requestOtp: useMutation({ mutationFn: (b: { email: string }) => api.post("/auth/request-otp", b) }),
    loginOtp: make("/auth/login-otp"),
  };
}

/**
 * Calls `/auth/me` once on mount to refresh the locally-stored account data
 * (name, email) against the database. This picks up admin-side changes (e.g. a
 * name edit) without requiring the user to log out and back in. If the server
 * detects a change it returns a fresh JWT token which we persist.
 */
export function useAuthRefresh() {
  const token = useAuth((s) => s.token);
  const setAuth = useAuth((s) => s.setAuth);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    api
      .get<{ success: boolean; account: AuthAccount; token?: string }>("/auth/me")
      .then(({ data }) => {
        if (cancelled) return;
        // Use the refreshed token if the server issued one (name/email changed),
        // otherwise keep the existing token.
        setAuth(data.token ?? token, data.account);
      })
      .catch(() => {
        /* silent — the 401 interceptor handles expired sessions */
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount
}

