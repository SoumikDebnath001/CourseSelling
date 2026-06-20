"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TestRef } from "@/types/api";

interface QDraft {
  questionText: string;
  options: string[];
  correctOption: number;
  points: number;
  explanation?: string;
}

interface Props {
  courseId: string;
  scope: "module" | "course" | "section";
  moduleId?: string;
  /** Level key when scope is "section". */
  section?: string;
  existing?: TestRef | null;
  saving?: boolean;
  onSave: (payload: Record<string, unknown>, id?: string) => void;
  onClose: () => void;
}

const heading = (scope: Props["scope"]) =>
  scope === "course" ? "Final course test" : scope === "section" ? "Section final test" : "Module test";

export function TestBuilder({ courseId, scope, moduleId, section, existing, saving, onSave, onClose }: Props) {
  const [title, setTitle] = useState(existing?.title ?? heading(scope));
  const [passingScorePct, setPassing] = useState(existing?.passingScorePct ?? 60);
  const [isPublished, setPublished] = useState(existing?.isPublished ?? true);
  const [questions, setQuestions] = useState<QDraft[]>(
    (existing?.questions as QDraft[] | undefined)?.length
      ? (existing!.questions as QDraft[])
      : [{ questionText: "", options: ["", ""], correctOption: 0, points: 1 }]
  );

  const update = (i: number, patch: Partial<QDraft>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const save = () => {
    const cleaned = questions
      .filter((q) => q.questionText.trim() && q.options.filter((o) => o.trim()).length >= 2)
      .map((q) => ({ ...q, options: q.options.filter((o) => o.trim()) }));
    if (cleaned.length === 0) return;
    onSave(
      {
        title,
        scope,
        courseId,
        moduleId: scope === "module" ? moduleId : undefined,
        section: scope === "section" ? section : undefined,
        questions: cleaned,
        passingScorePct,
        isPublished,
      },
      existing?._id
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
          <h2 className="text-lg font-bold text-ink-900">{heading(scope)}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 block">
              <span className="mb-1 block text-sm font-medium text-ink-700">Title</span>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700">Pass mark (%)</span>
              <input type="number" min={0} max={100} className="input" value={passingScorePct} onChange={(e) => setPassing(Number(e.target.value))} />
            </label>
            <label className="flex items-end gap-2 pb-2">
              <input type="checkbox" checked={isPublished} onChange={(e) => setPublished(e.target.checked)} className="accent-pitch-600" />
              <span className="text-sm text-ink-700">Published (visible to students)</span>
            </label>
          </div>

          {questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-ink-200 p-4">
              <div className="flex items-start gap-2">
                <span className="mt-2 text-sm font-bold text-ink-400">{i + 1}.</span>
                <input
                  className="input"
                  placeholder="Question"
                  value={q.questionText}
                  onChange={(e) => update(i, { questionText: e.target.value })}
                />
                <button onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))} className="mt-2 text-ink-400 hover:text-ball-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 space-y-2 pl-6">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${i}`}
                      checked={q.correctOption === oi}
                      onChange={() => update(i, { correctOption: oi })}
                      className="accent-pitch-600"
                      title="Mark correct"
                    />
                    <input
                      className="input py-1.5"
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={(e) => update(i, { options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)) })}
                    />
                    {q.options.length > 2 && (
                      <button onClick={() => update(i, { options: q.options.filter((_, idx) => idx !== oi) })} className="text-ink-300 hover:text-ball-600">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => update(i, { options: [...q.options, ""] })} className="text-xs font-semibold text-pitch-700">
                  + Add option
                </button>
                <input
                  className="input mt-2 py-1.5 text-sm"
                  placeholder="Explanation (optional, shown after submit)"
                  value={q.explanation ?? ""}
                  onChange={(e) => update(i, { explanation: e.target.value })}
                />
              </div>
            </div>
          ))}

          <Button variant="ghost" onClick={() => setQuestions((qs) => [...qs, { questionText: "", options: ["", ""], correctOption: 0, points: 1 }])}>
            <Plus className="h-4 w-4" /> Add question
          </Button>
        </div>

        <div className="flex gap-3 border-t border-ink-200 px-6 py-4">
          <Button className="flex-1" loading={saving} onClick={save}>Save test</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
