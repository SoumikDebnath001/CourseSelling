"use client";

import type { LevelDef } from "@/types/api";
import { cn } from "@/lib/utils";

/**
 * Animated segmented slider (glass toggle) for picking a level. 
 * Renders an iOS-style segmented control with a sliding active indicator.
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
  const active = sorted[idx];

  return (
    <div className="flex flex-col gap-3">
      {/* Glass Segmented Toggle */}
      <div className="relative flex w-full p-1.5 rounded-2xl bg-ink-200/50 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]">
        
        {/* Sliding active background indicator */}
        <div 
          className="absolute top-1.5 bottom-1.5 rounded-xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-white transition-all duration-300 ease-out"
          style={{ 
            width: `calc((100% - 12px) / ${count})`, 
            left: `calc(6px + (100% - 12px) / ${count} * ${idx})` 
          }}
        />

        {/* Buttons */}
        {sorted.map((l) => {
          const isActive = l.key === value;
          return (
            <button
              key={l.key}
              type="button"
              aria-label={l.label || l.name}
              onClick={() => onChange(l.key)}
              className={cn(
                "relative z-10 flex-1 flex items-center justify-center py-2.5 px-2 rounded-xl transition-colors duration-200",
                isActive ? "text-brand-700" : "text-ink-500 hover:text-ink-800"
              )}
            >
              <span className="text-xs sm:text-sm font-bold tracking-tight">{l.label || l.name}</span>
            </button>
          );
        })}
      </div>

      {/* Optional Description Box */}
      {showDescription && active && (
        <div className="mt-2 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
          <p className="text-sm font-extrabold text-brand-900">
            {active.name} <span className="font-medium text-brand-600/80 ml-1">· {active.label || active.name}</span>
          </p>
          {active.description && <p className="mt-1 text-xs leading-relaxed text-ink-600">{active.description}</p>}
        </div>
      )}
    </div>
  );
}
