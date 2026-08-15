"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { useTestForTaking, useSubmitTest } from "@/hooks/useTest";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type { SubmitResult } from "@/types/api";
import { cn } from "@/lib/utils";

export function TestRunner({ testId, onClose }: { testId: string; onClose: () => void }) {
  const { data: test, isLoading } = useTestForTaking(testId);
  const submit = useSubmitTest(testId);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);

  const selectSingle = (questionId: string, originalIndex: number) =>
    setAnswers((a) => ({ ...a, [questionId]: [originalIndex] }));

  const toggleMultiple = (questionId: string, originalIndex: number) =>
    setAnswers((a) => {
      const current = a[questionId] ?? [];
      const next = current.includes(originalIndex) ? current.filter((x) => x !== originalIndex) : [...current, originalIndex];
      return { ...a, [questionId]: next };
    });

  const onSubmit = () => {
    if (!test) return;
    const payload = {
      attemptId: test.attemptId,
      answers: Object.entries(answers).map(([questionId, selectedOptions]) => ({ questionId, selectedOptions })),
    };
    submit.mutate(payload, { onSuccess: (data) => setResult(data) });
  };

  const allAnswered = !!test && test.questions.every((q) => (answers[q._id]?.length ?? 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
          <h2 className="text-lg font-bold text-ink-900">{test?.title ?? "Test"}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner className="h-7 w-7" /></div>
          ) : result ? (
            <ResultView result={result} />
          ) : test ? (
            <div className="space-y-6">
              {test.description && <p className="text-sm text-ink-500">{test.description}</p>}
              {test.questions.map((q, qi) => (
                <div key={q._id}>
                  <p className="font-semibold text-ink-900">
                    {qi + 1}. {q.questionText}
                    {q.type === "multiple" && <span className="ml-2 text-xs font-normal text-ink-400">(select all that apply)</span>}
                  </p>
                  <div className="mt-2 space-y-2">
                    {q.options.map((opt) => {
                      const selected = (answers[q._id] ?? []).includes(opt.originalIndex);
                      return (
                        <label
                          key={opt.originalIndex}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                            selected ? "border-pitch-500 bg-pitch-50" : "border-ink-200 hover:bg-ink-50"
                          )}
                        >
                          <input
                            type={q.type === "multiple" ? "checkbox" : "radio"}
                            name={`q-${q._id}`}
                            checked={selected}
                            onChange={() =>
                              q.type === "multiple" ? toggleMultiple(q._id, opt.originalIndex) : selectSingle(q._id, opt.originalIndex)
                            }
                            className="accent-pitch-600"
                          />
                          {opt.text}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-ink-400">Test unavailable.</p>
          )}
        </div>

        <div className="border-t border-ink-200 px-6 py-4">
          {result ? (
            <Button variant="ghost" className="w-full" onClick={onClose}>Close</Button>
          ) : (
            <Button
              className="w-full"
              loading={submit.isPending}
              disabled={!allAnswered}
              onClick={onSubmit}
            >
              Submit test
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultView({ result }: { result: SubmitResult }) {
  return (
    <div className="text-center">
      <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full", result.passed ? "bg-pitch-100" : "bg-rose-gold-50")}>
        {result.passed ? <Trophy className="h-8 w-8 text-pitch-600" /> : <XCircle className="h-8 w-8 text-rose-gold-600" />}
      </div>
      <h3 className="mt-3 text-2xl font-extrabold text-ink-900">{result.scorePct}%</h3>
      <p className={cn("font-semibold", result.passed ? "text-pitch-700" : "text-rose-gold-600")}>
        {result.passed ? "Passed 🎉" : `Need ${result.passingScorePct}% to pass`}
      </p>

      <div className="mt-6 space-y-2 text-left">
        {result.review.map((r, i) => (
          <div key={r.questionId} className="flex items-start gap-2 rounded-lg border border-ink-200 p-3 text-sm">
            {r.correct ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pitch-600" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-gold-600" />
            )}
            <div>
              <span className="font-medium text-ink-700">
                Question {i + 1} — {r.pointsEarned}/{r.pointsPossible} pts
              </span>
              {r.explanation && <p className="mt-0.5 text-ink-500">{r.explanation}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
