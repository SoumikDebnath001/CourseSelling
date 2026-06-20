"use client";

import { useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSubmitPhysicalAssessment } from "@/hooks/useLearn";

interface Props {
  courseId: string;
  /** "course" for miscellaneous courses, "section" for a progressive section. */
  scope: "course" | "section";
  /** Level key when scope is "section". */
  level?: string;
  title: string;
  onClose: () => void;
}

/**
 * Collects the student's WhatsApp number (country code + number) and applies for the offline
 * physical assessment that gates a certificate. An admin reviews it in the admin panel.
 */
export function PhysicalAssessmentModal({ courseId, scope, level, title, onClose }: Props) {
  const submit = useSubmitPhysicalAssessment(courseId);
  const [code, setCode] = useState("+254");
  const [number, setNumber] = useState("");

  const valid = /^\+?\d{1,5}$/.test(code.trim()) && /^\d{4,15}$/.test(number.replace(/\s/g, ""));

  const onSubmit = () => {
    if (!valid) return;
    submit.mutate(
      {
        scope,
        level,
        whatsappCountryCode: code.trim(),
        whatsappNumber: number.replace(/\s/g, ""),
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pitch-50">
              <ShieldCheck className="h-5 w-5 text-pitch-600" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-ink-900">Physical assessment</h3>
              <p className="text-xs text-ink-400">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-ink-500">
          Share your WhatsApp number and our team will contact you to arrange the offline assessment.
          Your certificate unlocks once you pass.
        </p>

        <div className="mt-4">
          <span className="mb-1 block text-sm font-medium text-ink-700">WhatsApp number</span>
          <div className="flex gap-2">
            <input
              className="input w-24 shrink-0 text-center"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="+254"
              aria-label="Country code"
            />
            <input
              className="input flex-1"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="712345678"
              inputMode="numeric"
              aria-label="Phone number"
            />
          </div>
          <p className="mt-1 text-xs text-ink-400">Include your country code (e.g. +254 for Kenya).</p>
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={submit.isPending} disabled={!valid} onClick={onSubmit}>Submit</Button>
        </div>
      </div>
    </div>
  );
}
