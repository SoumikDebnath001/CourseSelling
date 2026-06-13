"use client";

import { Download, FileText, LinkIcon, Check } from "lucide-react";
import type { Topic } from "@/types/api";
import { cn } from "@/lib/utils";

interface Props {
  topic: Topic;
  completed: boolean;
  onComplete: () => void;
  completing?: boolean;
}

export function VideoPlayer({ topic, completed, onComplete, completing }: Props) {
  // Tick automatically the moment the video finishes (idempotent on the server).
  const handleEnded = () => {
    if (!completed) onComplete();
  };

  return (
    <div>
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        {topic.videoUrl ? (
          <video
            key={topic._id}
            src={topic.videoUrl}
            controls
            onEnded={handleEnded}
            className="h-full w-full"
            controlsList="nodownload"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-400">No video for this topic yet.</div>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-900">{topic.title}</h1>
          {topic.description && <p className="mt-1 text-sm text-ink-600">{topic.description}</p>}
        </div>

        {/* Tick box (replaces the old "Mark complete" button). Auto-ticks on video end. */}
        <button
          type="button"
          onClick={() => { if (!completed && !completing) onComplete(); }}
          disabled={completed || completing}
          aria-pressed={completed}
          className={cn(
            "flex shrink-0 items-center gap-2 text-sm font-medium transition",
            completed ? "text-pitch-700" : "text-ink-500 hover:text-ink-800"
          )}
        >
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md border-2 transition",
              completed
                ? "border-pitch-500 bg-pitch-500 text-white"
                : "border-ink-300 bg-white",
              completing && "opacity-60"
            )}
          >
            {completed && <Check className="h-4 w-4" strokeWidth={3} />}
          </span>
          {completed ? "Completed" : "Mark as done"}
        </button>
      </div>

      {topic.resources?.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-ink-700">Resources</h2>
          <ul className="space-y-2">
            {topic.resources.map((r, i) => (
              <li key={r._id ?? i}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                >
                  {r.type === "link" ? <LinkIcon className="h-4 w-4 text-pitch-600" /> : <FileText className="h-4 w-4 text-pitch-600" />}
                  <span className="flex-1 truncate">{r.name}</span>
                  {r.type !== "link" && <Download className="h-4 w-4 text-ink-400" />}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
