"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuth } from "@/store/auth";
import type { Progression, Certificate } from "@/types/api";

/** The signed-in learner's per-category progression. Disabled for admins/anonymous. */
export function useMyProgression() {
  const account = useAuth((s) => s.account);
  const enabled = account?.kind === "user";
  return useQuery({
    queryKey: ["my-progression"],
    queryFn: async () => {
      const { data } = await api.get<{ progression: Progression }>("/progression/me");
      return data.progression;
    },
    enabled,
  });
}

/** The signed-in learner's earned certificates (for the Certifications section). */
export function useMyCertificates() {
  const account = useAuth((s) => s.account);
  const enabled = account?.kind === "user";
  return useQuery({
    queryKey: ["my-certificates"],
    queryFn: async () => {
      const { data } = await api.get<{ certificates: Certificate[] }>("/progression/certificates");
      return data.certificates;
    },
    enabled,
  });
}
