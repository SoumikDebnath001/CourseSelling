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

/**
 * Paid courses: create a Pesapal order and hand the browser to the hosted
 * checkout page. Pesapal redirects back to /payment/callback afterwards.
 */
export function useInitiatePayment() {
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.post(`/payments/pesapal/initiate/${courseId}`);
      return data as { redirectUrl: string; orderTrackingId: string };
    },
    onSuccess: ({ redirectUrl }) => {
      window.location.assign(redirectUrl);
    },
    onError: (err) => toast.error(apiError(err, "Could not start the payment")),
  });
}

export interface PaymentStatusResult {
  status: "pending" | "paid" | "failed" | "reversed";
  courseId: string;
  courseName: string | null;
  courseSlug: string | null;
  amount: number;
  currency: string;
  confirmationCode: string | null;
}

/** Verify a payment's outcome with the backend (which re-checks with Pesapal). */
export async function fetchPaymentStatus(orderTrackingId: string): Promise<PaymentStatusResult> {
  const { data } = await api.get(`/payments/pesapal/status`, { params: { orderTrackingId } });
  return data.payment as PaymentStatusResult;
}
