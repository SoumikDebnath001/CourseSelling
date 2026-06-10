"use client";

import { useState } from "react";
import { ChevronDown, PlayCircle, Lock, FileText, ClipboardCheck } from "lucide-react";
import type { Module } from "@/types/api";
import { formatDuration } from "@/lib/utils";

/** Read-only curriculum preview used on the course landing page (videos locked). */
export function ModuleAccordion({ modules }: { modules: Module[] }) {
  return (
    <div className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-white">
      {modules.map((m, i) => (
        <ModuleRow key={m._id} module={m} defaultOpen={i === 0} />
      ))}
      {modules.length === 0 && <p className="p-4 text-sm text-ink-400">Curriculum coming soon.</p>}
    </div>
  );
}

function ModuleRow({ module, defaultOpen }: { module: Module; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="font-semibold text-ink-900">{module.moduleName}</span>
        <span className="flex items-center gap-2 text-xs text-ink-400">
          {module.topics.length} topics
          {module.test && <span className="rounded bg-ball-50 px-1.5 py-0.5 text-ball-600">Test</span>}
          <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <ul className="bg-ink-50/60 px-4 pb-3">
          {module.topics.map((t) => (
            <li key={t._id} className="flex items-center justify-between py-1.5 text-sm text-ink-600">
              <span className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-ink-400" />
                {t.title}
              </span>
              <span className="flex items-center gap-3 text-xs text-ink-400">
                {t.resources.length > 0 && <FileText className="h-3.5 w-3.5" />}
                {t.timeDurationSec ? formatDuration(t.timeDurationSec) : ""}
                <Lock className="h-3.5 w-3.5" />
              </span>
            </li>
          ))}
          {module.test && (
            <li className="flex items-center gap-2 py-1.5 text-sm text-ball-600">
              <ClipboardCheck className="h-4 w-4" /> Module test
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
