"use client";

import { Download, FileText, LinkIcon, CheckCircle2 } from "lucide-react";
import type { Topic } from "@/types/api";
import { Button } from "@/components/ui/Button";

interface Props {
  topic: Topic;
  completed: boolean;
  onComplete: () => void;
  completing?: boolean;
}

export function VideoPlayer({ topic, completed, onComplete, completing }: Props) {
  return (
    <div>
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        {topic.videoUrl ? (
          <video key={topic._id} src={topic.videoUrl} controls className="h-full w-full" controlsList="nodownload" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-400">No video for this topic yet.</div>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-900">{topic.title}</h1>
          {topic.description && <p className="mt-1 text-sm text-ink-600">{topic.description}</p>}
        </div>
        <Button
          variant={completed ? "ghost" : "primary"}
          onClick={onComplete}
          loading={completing}
          disabled={completed}
          className="shrink-0"
        >
          <CheckCircle2 className="h-4 w-4" />
          {completed ? "Completed" : "Mark complete"}
        </Button>
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
