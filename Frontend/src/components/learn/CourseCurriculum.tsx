"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, PlayCircle, ClipboardCheck, Trophy } from "lucide-react";
import type { Course } from "@/types/api";
import { cn } from "@/lib/utils";

interface Props {
  course: Course;
  activeTopicId?: string;
  completedSet: Set<string>;
  passedSet: Set<string>;
  onSelectTopic: (topicId: string) => void;
  onSelectTest: (testId: string) => void;
  onMarkTopicDone: (topicId: string) => void;
}

function fmtDuration(totalSec: number): string {
  if (!totalSec) return "—";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

export function CourseCurriculum({
  course,
  activeTopicId,
  completedSet,
  passedSet,
  onSelectTopic,
  onSelectTest,
  onMarkTopicDone,
}: Props) {
  // The module that holds the active topic starts open; otherwise the first one.
  const initialOpen =
    course.modules.find((m) => m.topics.some((t) => t._id === activeTopicId))?._id ??
    course.modules[0]?._id;
  const [open, setOpen] = useState<Set<string>>(new Set(initialOpen ? [initialOpen] : []));

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-200 px-5 py-4">
        <h2 className="text-lg font-bold text-ink-900">Course Content</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {course.modules.map((m) => {
          const isOpen = open.has(m._id);
          const moduleSec = m.topics.reduce((sum, t) => sum + (t.timeDurationSec ?? 0), 0);
          const doneCount = m.topics.filter((t) => completedSet.has(t._id)).length;

          return (
            <div key={m._id} className="border-b border-ink-100">
              <button
                onClick={() => toggle(m._id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition",
                  isOpen ? "bg-brand-50/60" : "hover:bg-ink-50"
                )}
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink-900">{m.moduleName}</h3>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {fmtDuration(moduleSec)} · {doneCount} / {m.topics.length} lectures
                  </p>
                </div>
                <ChevronDown
                  className={cn("h-5 w-5 shrink-0 text-ink-400 transition", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <div className="pb-2">
                  {m.topics.map((t) => {
                    const done = completedSet.has(t._id);
                    const active = activeTopicId === t._id;
                    return (
                      <button
                        key={t._id}
                        onClick={() => onSelectTopic(t._id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm transition",
                          active ? "bg-brand-50 text-brand-800" : "text-ink-600 hover:bg-ink-50"
                        )}
                      >
                        <PlayCircle
                          className={cn("h-4 w-4 shrink-0", active ? "text-brand-600" : "text-ink-300")}
                        />
                        <span className="line-clamp-1 flex-1">{t.title}</span>
                        {t.timeDurationSec ? (
                          <span className="shrink-0 text-xs text-ink-400">{fmtDuration(t.timeDurationSec)}</span>
                        ) : null}
                        <span
                          role="checkbox"
                          aria-checked={done}
                          title={done ? "Completed" : "Mark as done"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!done) onMarkTopicDone(t._id);
                          }}
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded transition",
                            done ? "bg-pitch-500" : "border-2 border-ink-300 hover:border-pitch-400"
                          )}
                        >
                          {done && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </span>
                      </button>
                    );
                  })}

                  {m.test?.isPublished && (
                    <button
                      onClick={() => onSelectTest(m.test!._id)}
                      className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm text-grape-700 hover:bg-grape-50/60"
                    >
                      <ClipboardCheck className="h-4 w-4 shrink-0" />
                      <span className="flex-1">Module test</span>
                      {passedSet.has(m.test._id) && (
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-pitch-500">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {course.finalTest?.isPublished && (
          <button
            onClick={() => onSelectTest(course.finalTest!._id)}
            className="flex w-full items-center gap-3 bg-gradient-to-r from-brand-50 to-grape-50 px-5 py-4 text-left text-sm font-semibold text-brand-800 hover:from-brand-100 hover:to-grape-100"
          >
            <Trophy className="h-5 w-5 shrink-0 text-grape-600" />
            <span className="flex-1">Final course test</span>
            {passedSet.has(course.finalTest._id) && (
              <span className="flex h-5 w-5 items-center justify-center rounded bg-pitch-500">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
