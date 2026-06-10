"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { TestForTaking, SubmitResult } from "@/types/api";

export function useTestForTaking(testId: string | null) {
  return useQuery({
    queryKey: ["test", testId],
    queryFn: async () => {
      const { data } = await api.get<{ test: TestForTaking }>(`/tests/${testId}`);
      return data.test;
    },
    enabled: !!testId,
  });
}

export function useSubmitTest(testId: string) {
  return useMutation({
    mutationFn: async (answers: { questionIndex: number; selectedOption: number }[]) => {
      const { data } = await api.post<{ success: boolean } & SubmitResult>(`/tests/${testId}/submit`, { answers });
      return data;
    },
  });
}
