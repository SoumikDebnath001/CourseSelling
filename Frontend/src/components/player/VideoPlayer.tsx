"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Download, FileText, LinkIcon, Check } from "lucide-react";
import type { Resource, Topic } from "@/types/api";
import { formatBytes, formatLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PdfViewer } from "./PdfViewer";

function isPdfResource(r: Resource): boolean {
  return r.format === "pdf" || r.name.toLowerCase().endsWith(".pdf");
}

interface Props {
  topic: Topic;
  completed: boolean;
  onComplete: () => void;
  completing?: boolean;
}

/**
 * Plays a topic video. Cloudflare Stream delivers adaptive HLS (.m3u8): Safari plays it
 * natively, other browsers need hls.js. Plain MP4/other URLs are set directly.
 */
function CourseVideo({ topic, onEnded }: { topic: Topic; onEnded: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const src = topic.videoUrl ?? "";

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    const isHls = src.includes(".m3u8");
    const nativeHls = video.canPlayType("application/vnd.apple.mpegurl");

    if (isHls && !nativeHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
    video.src = src;
  }, [src]);

  return (
    <video
      key={topic._id}
      ref={ref}
      controls
      onEnded={onEnded}
      className="h-full w-full"
      controlsList="nodownload"
    />
  );
}

export function VideoPlayer({ topic, completed, onComplete, completing }: Props) {
  const [openPdf, setOpenPdf] = useState<Resource | null>(null);

  // Tick automatically the moment the video finishes (idempotent on the server).
  const handleEnded = () => {
    if (!completed) onComplete();
  };

  return (
    <div>
      {topic.videoUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <CourseVideo topic={topic} onEnded={handleEnded} />
        </div>
      ) : topic.resources?.length > 0 ? (
        <div className="rounded-xl border border-dashed border-ink-300 bg-ink-50 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-ink-400" />
          <h3 className="mt-2 text-sm font-semibold text-ink-900">Resource Only Topic</h3>
          <p className="mt-1 text-sm text-ink-500">
            This topic does not have a video. Please download or preview the resources below to complete it.
          </p>
        </div>
      ) : (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <div className="flex h-full items-center justify-center text-ink-400">No content for this topic yet.</div>
        </div>
      )}

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
            {topic.resources.map((r, i) => {
              const content = (
                <>
                  {r.type === "link" ? <LinkIcon className="h-4 w-4 shrink-0 text-pitch-600" /> : <FileText className="h-4 w-4 shrink-0 text-pitch-600" />}
                  <span className="flex-1 truncate">{r.name}</span>
                  {/* Format + size shown up front, before the student downloads. */}
                  {r.type !== "link" && (
                    <>
                      <span className="shrink-0 rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink-600">
                        {formatLabel(r.format, r.name)}
                      </span>
                      {r.size !== undefined && <span className="shrink-0 text-xs text-ink-400">{formatBytes(r.size)}</span>}
                      <Download className="h-4 w-4 shrink-0 text-ink-400" />
                    </>
                  )}
                </>
              );
              return (
                <li key={r._id ?? i}>
                  {r.url && isPdfResource(r) ? (
                    <button
                      type="button"
                      onClick={() => setOpenPdf(r)}
                      className="flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                    >
                      {content}
                    </button>
                  ) : (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                    >
                      {content}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {openPdf?.url && (
        <PdfViewer
          name={openPdf.name}
          url={openPdf.url}
          completed={completed}
          onConfirmComplete={onComplete}
          onClose={() => setOpenPdf(null)}
        />
      )}
    </div>
  );
}
