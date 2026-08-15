"use client";

import { useMemo, useRef, useState } from "react";
import { X, Plus, Trash2, Copy, Upload, Pencil, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import type { TestRef } from "@/types/api";

interface QDraft {
  questionText: string;
  type: "single" | "multiple";
  options: string[];
  correctOption: number;
  correctOptions: number[];
  points: number;
  negativeMarks?: number;
  negativePerWrongOption?: number;
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
  /** Whether this test's course/section gates a physical assessment — changes the score field's label. */
  requiresPhysicalAssessment?: boolean;
}

const heading = (scope: Props["scope"]) =>
  scope === "course" ? "Final course test" : scope === "section" ? "Section final test" : "Module test";

const blankQuestion = (): QDraft => ({
  questionText: "",
  type: "single",
  options: ["", ""],
  correctOption: 0,
  correctOptions: [],
  points: 1,
});

const AI_PROMPT = `Generate quiz questions for an e-learning test. Reply with ONLY a JSON array (no markdown code fences, no commentary before or after) — each element must match this exact shape:

[
  {
    "questionText": "string, the question",
    "type": "single",
    "options": ["option A", "option B", "option C", "option D"],
    "correctOption": 0,
    "points": 1,
    "negativeMarks": 0,
    "explanation": "string, optional, shown to the student after they submit"
  },
  {
    "questionText": "string, the question",
    "type": "multiple",
    "options": ["option A", "option B", "option C", "option D"],
    "correctOptions": [0, 2],
    "points": 2,
    "negativePerWrongOption": 0.5,
    "explanation": "string, optional"
  }
]

Rules:
- "type": "single" -> exactly one correct answer. Set "correctOption" to the zero-based index of the correct option. Omit "correctOptions".
- "type": "multiple" -> two or more correct answers. Set "correctOptions" to the zero-based indices of every correct option. Omit "correctOption".
- "options" needs at least 2 entries.
- "points" is the marks earned for a fully correct answer.
- "negativeMarks" (single-choice only, optional) is the marks deducted for a wrong answer. Omit or set to 0 for no penalty.
- "negativePerWrongOption" (multiple-choice only, optional) is the marks deducted per incorrectly-selected option. Omit or set to 0 for no penalty.
- "explanation" is optional.

Now generate [NUMBER] questions about: [TOPIC].`;

interface ImportedQuestion {
  questionText?: unknown;
  type?: unknown;
  options?: unknown;
  correctOption?: unknown;
  correctOptions?: unknown;
  points?: unknown;
  negativeMarks?: unknown;
  negativePerWrongOption?: unknown;
  explanation?: unknown;
}

function parseImportedQuestion(raw: ImportedQuestion): QDraft | null {
  if (typeof raw.questionText !== "string" || !raw.questionText.trim()) return null;
  const options = Array.isArray(raw.options)
    ? raw.options.filter((o): o is string => typeof o === "string" && o.trim().length > 0)
    : [];
  if (options.length < 2) return null;

  const type: "single" | "multiple" = raw.type === "multiple" ? "multiple" : "single";
  const points = typeof raw.points === "number" && raw.points > 0 ? raw.points : 1;
  const explanation = typeof raw.explanation === "string" && raw.explanation.trim() ? raw.explanation : undefined;

  if (type === "single") {
    const correctOption =
      typeof raw.correctOption === "number" && raw.correctOption >= 0 && raw.correctOption < options.length
        ? raw.correctOption
        : 0;
    const negativeMarks = typeof raw.negativeMarks === "number" && raw.negativeMarks >= 0 ? raw.negativeMarks : undefined;
    return { questionText: raw.questionText, type, options, correctOption, correctOptions: [], points, negativeMarks, explanation };
  }

  const correctOptions = Array.isArray(raw.correctOptions)
    ? [...new Set(raw.correctOptions.filter((n): n is number => typeof n === "number" && n >= 0 && n < options.length))].sort(
        (a, b) => a - b
      )
    : [];
  if (correctOptions.length === 0) return null;
  const negativePerWrongOption =
    typeof raw.negativePerWrongOption === "number" && raw.negativePerWrongOption >= 0 ? raw.negativePerWrongOption : undefined;
  return { questionText: raw.questionText, type, options, correctOption: 0, correctOptions, points, negativePerWrongOption, explanation };
}

/** Mirrors Backend/src/utils/testAssembly.ts's enumerateCombos — a lightweight client-side
 *  preview so the admin sees feasibility before saving; the server remains the source of truth. */
function hasValidCombo(tiers: Record<number, number>, targetCount: number, targetMarks: number): boolean {
  const values = Object.keys(tiers).map(Number).sort((a, b) => a - b);
  let found = false;
  function backtrack(idx: number, remainingCount: number, remainingMarks: number) {
    if (found) return;
    if (idx === values.length) {
      if (remainingCount === 0 && remainingMarks === 0) found = true;
      return;
    }
    const v = values[idx];
    const avail = tiers[v];
    const upper = Math.min(avail, remainingCount, v > 0 ? Math.floor(remainingMarks / v) : remainingCount);
    for (let c = 0; c <= upper && !found; c++) backtrack(idx + 1, remainingCount - c, remainingMarks - c * v);
  }
  backtrack(0, targetCount, targetMarks);
  return found;
}

export function TestBuilder({ courseId, scope, moduleId, section, existing, saving, onSave, onClose, requiresPhysicalAssessment }: Props) {
  const [title, setTitle] = useState(existing?.title ?? heading(scope));
  const [passingScorePct, setPassing] = useState(existing?.passingScorePct ?? 60);
  const [isPublished, setPublished] = useState(existing?.isPublished ?? true);
  const [assemblyMode, setAssemblyMode] = useState<"fixed" | "random">(existing?.assemblyMode ?? "fixed");
  const [targetQuestionCount, setTargetQuestionCount] = useState(existing?.randomConfig?.targetQuestionCount ?? 10);
  const [targetTotalMarks, setTargetTotalMarks] = useState(existing?.randomConfig?.targetTotalMarks ?? 20);
  const [bulkPoints, setBulkPoints] = useState(1);
  const [bulkNegative, setBulkNegative] = useState(0);
  const [questions, setQuestions] = useState<QDraft[]>(
    existing?.questions?.length
      ? existing.questions.map((q) => ({
          questionText: q.questionText,
          type: q.type ?? "single",
          options: q.options,
          correctOption: q.correctOption ?? 0,
          correctOptions: q.correctOptions ?? [],
          points: q.points,
          negativeMarks: q.negativeMarks,
          negativePerWrongOption: q.negativePerWrongOption,
          explanation: q.explanation,
        }))
      : [blankQuestion()]
  );
  const [openIndex, setOpenIndex] = useState<number | null>(questions.length === 1 ? 0 : null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      toast.success("Prompt copied — paste it into ChatGPT or any AI, then upload its JSON reply.");
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  };

  const handleJsonFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : Array.isArray(data?.questions) ? data.questions : null;
      if (!arr) throw new Error("Expected a JSON array of questions.");
      const parsed = (arr as ImportedQuestion[]).map(parseImportedQuestion);
      const valid = parsed.filter((q): q is QDraft => q !== null);
      const skipped = parsed.length - valid.length;
      if (valid.length === 0) {
        toast.error("No valid questions found in that file.");
        return;
      }
      setQuestions((qs) => {
        const withoutBlank = qs.length === 1 && !qs[0].questionText.trim() ? [] : qs;
        return [...withoutBlank, ...valid];
      });
      setOpenIndex(null);
      toast.success(
        `Added ${valid.length} question${valid.length === 1 ? "" : "s"}${skipped ? ` — ${skipped} skipped (invalid format)` : ""}.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? `Couldn't read that file: ${err.message}` : "Couldn't read that file.");
    }
  };

  const update = (i: number, patch: Partial<QDraft>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const toggleCorrectOption = (i: number, oi: number) =>
    setQuestions((qs) =>
      qs.map((q, idx) => {
        if (idx !== i) return q;
        const has = q.correctOptions.includes(oi);
        return { ...q, correctOptions: has ? q.correctOptions.filter((x) => x !== oi) : [...q.correctOptions, oi].sort() };
      })
    );

  const applyBulk = () =>
    setQuestions((qs) => qs.map((q) => ({ ...q, points: bulkPoints, negativeMarks: bulkNegative, negativePerWrongOption: bulkNegative })));

  const tierSummary = useMemo(() => {
    const tiers: Record<number, number> = {};
    for (const q of questions) {
      if (!q.questionText.trim()) continue;
      tiers[q.points] = (tiers[q.points] ?? 0) + 1;
    }
    return tiers;
  }, [questions]);

  const comboFeasible = useMemo(() => {
    if (assemblyMode !== "random") return true;
    return hasValidCombo(tierSummary, targetQuestionCount, targetTotalMarks);
  }, [assemblyMode, tierSummary, targetQuestionCount, targetTotalMarks]);

  const save = () => {
    const cleaned = questions
      .filter((q) => q.questionText.trim() && q.options.filter((o) => o.trim()).length >= 2)
      .map((q) => {
        const options = q.options.filter((o) => o.trim());
        return q.type === "single"
          ? { questionText: q.questionText, type: q.type, options, correctOption: q.correctOption, points: q.points, negativeMarks: q.negativeMarks, explanation: q.explanation }
          : { questionText: q.questionText, type: q.type, options, correctOptions: q.correctOptions, points: q.points, negativePerWrongOption: q.negativePerWrongOption, explanation: q.explanation };
      });
    if (cleaned.length === 0) return;
    onSave(
      {
        title,
        scope,
        courseId,
        moduleId: scope === "module" ? moduleId : undefined,
        section: scope === "section" ? section : undefined,
        assemblyMode,
        randomConfig: assemblyMode === "random" ? { targetQuestionCount, targetTotalMarks } : undefined,
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
              <span className="mb-1 block text-sm font-medium text-ink-700">
                {requiresPhysicalAssessment ? "Qualifying Score (%)" : "Passing Score (%)"}
              </span>
              <input type="number" min={0} max={100} className="input" value={passingScorePct} onChange={(e) => setPassing(Number(e.target.value))} />
            </label>
            <label className="flex items-end gap-2 pb-2">
              <input type="checkbox" checked={isPublished} onChange={(e) => setPublished(e.target.checked)} className="accent-pitch-600" />
              <span className="text-sm text-ink-700">Published (visible to students)</span>
            </label>
          </div>

          <div className="rounded-lg border border-ink-200 p-4">
            <span className="mb-2 block text-sm font-medium text-ink-700">Question assembly</span>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={assemblyMode === "fixed"} onChange={() => setAssemblyMode("fixed")} className="accent-pitch-600" />
                Fixed — every student sees all questions
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={assemblyMode === "random"} onChange={() => setAssemblyMode("random")} className="accent-pitch-600" />
                Random draw from a pool
              </label>
            </div>
            {assemblyMode === "random" && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink-600">Questions per exam</span>
                    <input type="number" min={1} className="input" value={targetQuestionCount} onChange={(e) => setTargetQuestionCount(Number(e.target.value))} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink-600">Total marks per exam</span>
                    <input type="number" min={1} className="input" value={targetTotalMarks} onChange={(e) => setTargetTotalMarks(Number(e.target.value))} />
                  </label>
                </div>
                <p className="text-xs text-ink-500">
                  Pool by marks: {Object.entries(tierSummary).length === 0 ? "no questions yet" : Object.entries(tierSummary).map(([pts, n]) => `${pts}-mark: ${n}`).join(", ")}
                </p>
                <p className={comboFeasible ? "text-xs font-medium text-pitch-700" : "text-xs font-medium text-rose-gold-600"}>
                  {comboFeasible ? "✓ A valid combination of questions can meet these targets." : "✗ No combination of the current questions can meet these targets — add more questions or adjust the targets."}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-ink-200 bg-ink-50 p-3">
            <span className="block text-sm font-medium text-ink-700">Question bank</span>
            <p className="text-xs text-ink-500">
              Copy the prompt below into ChatGPT (or any AI), ask it to write questions for this course, then upload its JSON reply here in bulk.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={copyPrompt}>
                <Copy className="h-4 w-4" /> Copy AI prompt
              </Button>
              <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload JSON
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleJsonFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Bulk marks</span>
              <input type="number" min={1} className="input py-1.5" value={bulkPoints} onChange={(e) => setBulkPoints(Number(e.target.value))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Bulk negative marks</span>
              <input type="number" min={0} className="input py-1.5" value={bulkNegative} onChange={(e) => setBulkNegative(Number(e.target.value))} />
            </label>
            <Button variant="ghost" onClick={applyBulk}>Apply to all questions</Button>
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-ink-700">
              Questions ({questions.length}){questions.some((q) => q.questionText.trim()) ? "" : " — none yet"}
            </span>
            {questions.map((q, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i} className="rounded-lg border border-ink-200">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="shrink-0 text-xs font-bold text-ink-400">{i + 1}.</span>
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className="min-w-0 flex-1 truncate text-left text-sm text-ink-800"
                    >
                      {q.questionText.trim() || "(untitled question)"}
                    </button>
                    <span className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-600">
                      {q.type === "single" ? "Single" : "Multi"}
                    </span>
                    <span className="shrink-0 text-xs text-ink-400">
                      {q.points} pt{q.points === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className="shrink-0 text-ink-400 hover:text-ink-700"
                      title={isOpen ? "Collapse" : "Edit"}
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuestions((qs) => qs.filter((_, idx) => idx !== i));
                        setOpenIndex((cur) => (cur === null ? null : cur === i ? null : cur > i ? cur - 1 : cur));
                      }}
                      className="shrink-0 text-ink-400 hover:text-rose-gold-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-ink-200 p-4">
                      <input
                        className="input"
                        placeholder="Question"
                        value={q.questionText}
                        onChange={(e) => update(i, { questionText: e.target.value })}
                      />

                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                        <label className="flex items-center gap-2">
                          <input type="radio" checked={q.type === "single"} onChange={() => update(i, { type: "single" })} className="accent-pitch-600" />
                          Single choice
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" checked={q.type === "multiple"} onChange={() => update(i, { type: "multiple" })} className="accent-pitch-600" />
                          Multiple choice
                        </label>
                        <label className="flex items-center gap-2">
                          <span className="text-xs font-medium text-ink-600">Marks</span>
                          <input type="number" min={1} className="input w-20 py-1.5" value={q.points} onChange={(e) => update(i, { points: Number(e.target.value) })} />
                        </label>
                        {q.type === "single" ? (
                          <label className="flex items-center gap-2">
                            <span className="text-xs font-medium text-ink-600">Negative marks</span>
                            <input type="number" min={0} className="input w-20 py-1.5" value={q.negativeMarks ?? 0} onChange={(e) => update(i, { negativeMarks: Number(e.target.value) })} />
                          </label>
                        ) : (
                          <label className="flex items-center gap-2">
                            <span className="text-xs font-medium text-ink-600">Penalty per wrong pick</span>
                            <input type="number" min={0} className="input w-20 py-1.5" value={q.negativePerWrongOption ?? 0} onChange={(e) => update(i, { negativePerWrongOption: Number(e.target.value) })} />
                          </label>
                        )}
                      </div>

                      <div className="mt-3 space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            {q.type === "single" ? (
                              <input
                                type="radio"
                                name={`correct-${i}`}
                                checked={q.correctOption === oi}
                                onChange={() => update(i, { correctOption: oi })}
                                className="accent-pitch-600"
                                title="Mark correct"
                              />
                            ) : (
                              <input
                                type="checkbox"
                                checked={q.correctOptions.includes(oi)}
                                onChange={() => toggleCorrectOption(i, oi)}
                                className="accent-pitch-600"
                                title="Mark correct"
                              />
                            )}
                            <input
                              className="input py-1.5"
                              placeholder={`Option ${oi + 1}`}
                              value={opt}
                              onChange={(e) => update(i, { options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)) })}
                            />
                            {q.options.length > 2 && (
                              <button onClick={() => update(i, { options: q.options.filter((_, idx) => idx !== oi) })} className="text-ink-300 hover:text-rose-gold-600">
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
                  )}
                </div>
              );
            })}
          </div>

          <Button
            variant="ghost"
            onClick={() =>
              setQuestions((qs) => {
                setOpenIndex(qs.length);
                return [...qs, blankQuestion()];
              })
            }
          >
            <Plus className="h-4 w-4" /> Add question
          </Button>
        </div>

        <div className="flex gap-3 border-t border-ink-200 px-6 py-4">
          <Button className="flex-1" loading={saving} disabled={assemblyMode === "random" && !comboFeasible} onClick={save}>Save test</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
