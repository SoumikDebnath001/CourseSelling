"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuth } from "@/store/auth";
import type { LoginResponse } from "@/types/api";

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
