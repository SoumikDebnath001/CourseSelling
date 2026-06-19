"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (answers: { questionIndex: number; selectedOption: number }[]) => {
      const { data } = await api.post<{ success: boolean } & SubmitResult>(`/tests/${testId}/submit`, { answers });
      return data;
    },
    onSuccess: (data) => {
      // Passing a module/final test can credit points or complete the course.
      if (data.passed) {
        qc.invalidateQueries({ queryKey: ["my-progression"] });
        qc.invalidateQueries({ queryKey: ["my-certificates"] });
        qc.invalidateQueries({ queryKey: ["my-courses"] });
        qc.invalidateQueries({ queryKey: ["full-course"] });
      }
    },
  });
}
