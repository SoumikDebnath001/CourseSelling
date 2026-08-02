"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  name: string;
  url: string;
  completed: boolean;
  onConfirmComplete: () => void;
  onClose: () => void;
}

/** In-page PDF modal. Rendering inline (instead of a new-tab download link) lets us hook
 *  the "student actually opened this" moment to a mark-as-complete confirm, the way a
 *  video's onEnded already does. */
export function PdfViewer({ name, url, completed, onConfirmComplete, onClose }: Props) {
  const [prompted, setPrompted] = useState(false);

  const handleLoad = () => {
    if (completed || prompted) return;
    setPrompted(true);
    if (window.confirm(`Mark "${name}" as complete?`)) {
      onConfirmComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-4">
      <div className="flex items-center justify-between pb-3">
        <h2 className="truncate pr-4 text-sm font-semibold text-white">{name}</h2>
        <button type="button" onClick={onClose} className="shrink-0 text-white/80 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl bg-white">
        <iframe src={url} title={name} className="h-full w-full" onLoad={handleLoad} />
      </div>
    </div>
  );
}
