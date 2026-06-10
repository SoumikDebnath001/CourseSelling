"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "@/lib/axios";
import toast from "react-hot-toast";

export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.post(`/enroll/${courseId}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Enrolled! You can start learning now.");
      qc.invalidateQueries({ queryKey: ["course"] });
      qc.invalidateQueries({ queryKey: ["my-courses"] });
    },
    onError: (err) => toast.error(apiError(err, "Could not enrol")),
  });
}
