"use client";

import type { LevelDef } from "@/types/api";
import { cn } from "@/lib/utils";

/**
 * Animated segmented slider for picking a level. Renders an ordered track with a thumb
 * that smoothly transitions between stops, clickable level labels, and (optionally) the
 * selected level's informational description box.
 */
export function LevelSlider({
  levels,
  value,
  onChange,
  showDescription = true,
}: {
  levels: LevelDef[];
  value: string;
  onChange: (key: string) => void;
  showDescription?: boolean;
}) {
  const sorted = [...levels].sort((a, b) => a.order - b.order);
  const count = sorted.length;
  const idx = Math.max(0, sorted.findIndex((l) => l.key === value));
  const pct = count > 1 ? (idx / (count - 1)) * 100 : 0;
  const active = sorted[idx];

  return (
    <div>
      <div className="relative px-1 pt-2">
        {/* Track */}
        <div className="h-2 rounded-full bg-ink-100" />
        {/* Filled portion */}
        <div
          className="absolute left-1 top-2 h-2 rounded-full bg-gradient-to-r from-brand-500 to-grape-500 transition-all duration-300 ease-out"
          style={{ width: `calc(${pct}% )`, maxWidth: "calc(100% - 0.5rem)" }}
        />
        {/* Stops */}
        <div className="absolute inset-x-1 top-2 flex -translate-y-0 justify-between">
          {sorted.map((l, i) => (
            <button
              key={l.key}
              type="button"
              aria-label={l.label || l.name}
              onClick={() => onChange(l.key)}
              className={cn(
                "relative -mt-1 h-4 w-4 rounded-full border-2 transition-all duration-300",
                i <= idx ? "border-grape-500 bg-white" : "border-ink-200 bg-white"
              )}
            />
          ))}
        </div>
        {/* Thumb */}
        <div
          className="pointer-events-none absolute top-2 h-5 w-5 -translate-x-1/2 -translate-y-0.5 rounded-full bg-grape-600 shadow ring-2 ring-white transition-all duration-300 ease-out"
          style={{ left: `calc(0.25rem + (100% - 0.5rem) * ${pct / 100})` }}
        />
      </div>

      {/* Labels */}
      <div className="mt-3 flex justify-between text-xs font-medium">
        {sorted.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => onChange(l.key)}
            className={cn("text-center transition-colors", l.key === value ? "font-bold text-grape-700" : "text-ink-400 hover:text-ink-600")}
          >
            {l.label || l.name}
          </button>
        ))}
      </div>

      {showDescription && active && (
        <div className="mt-3 rounded-xl border border-grape-100 bg-grape-50/60 p-3">
          <p className="text-sm font-bold text-grape-800">
            {active.name} <span className="font-normal text-grape-500">· {active.label || active.name}</span>
          </p>
          {active.description && <p className="mt-0.5 text-xs text-ink-600">{active.description}</p>}
        </div>
      )}
    </div>
  );
}
