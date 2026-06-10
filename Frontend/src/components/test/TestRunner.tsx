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
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);

  const onSubmit = () => {
    const payload = Object.entries(answers).map(([qi, opt]) => ({ questionIndex: Number(qi), selectedOption: opt }));
    submit.mutate(payload, { onSuccess: (data) => setResult(data) });
  };

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
                <div key={qi}>
                  <p className="font-semibold text-ink-900">
                    {qi + 1}. {q.questionText}
                  </p>
                  <div className="mt-2 space-y-2">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                          answers[qi] === oi ? "border-pitch-500 bg-pitch-50" : "border-ink-200 hover:bg-ink-50"
                        )}
                      >
                        <input
                          type="radio"
                          name={`q-${qi}`}
                          checked={answers[qi] === oi}
                          onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                          className="accent-pitch-600"
                        />
                        {opt}
                      </label>
                    ))}
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
              disabled={!test || Object.keys(answers).length !== test.questions.length}
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
      <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full", result.passed ? "bg-pitch-100" : "bg-ball-50")}>
        {result.passed ? <Trophy className="h-8 w-8 text-pitch-600" /> : <XCircle className="h-8 w-8 text-ball-600" />}
      </div>
      <h3 className="mt-3 text-2xl font-extrabold text-ink-900">{result.scorePct}%</h3>
      <p className={cn("font-semibold", result.passed ? "text-pitch-700" : "text-ball-600")}>
        {result.passed ? "Passed 🎉" : `Need ${result.passingScorePct}% to pass`}
      </p>

      <div className="mt-6 space-y-2 text-left">
        {result.review.map((r) => (
          <div key={r.questionIndex} className="flex items-start gap-2 rounded-lg border border-ink-200 p-3 text-sm">
            {r.correct ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pitch-600" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-ball-600" />
            )}
            <div>
              <span className="font-medium text-ink-700">Question {r.questionIndex + 1}</span>
              {r.explanation && <p className="mt-0.5 text-ink-500">{r.explanation}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
