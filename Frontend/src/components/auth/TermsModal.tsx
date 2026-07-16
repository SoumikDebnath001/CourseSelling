"use client";

import { useState } from "react";
import { X, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Renders the admin-editable terms text. Light convention:
 *   "## "  → section heading
 *   "- "   → bullet list item
 *   blank line → paragraph break
 */
function TermsBody({ content }: { content: string }) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = (key: number) => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`ul-${key}`} className="list-disc space-y-1 pl-5 text-sm text-ink-600">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  content.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
      return;
    }
    flushBullets(i);
    if (!line) return;
    if (line.startsWith("## ")) {
      blocks.push(
        <h4 key={i} className="pt-2 text-sm font-bold text-ink-900">
          {line.slice(3)}
        </h4>
      );
    } else {
      blocks.push(
        <p key={i} className="text-sm leading-relaxed text-ink-600">
          {line}
        </p>
      );
    }
  });
  flushBullets(-1);

  return <div className="space-y-3">{blocks}</div>;
}

/**
 * Terms & Conditions pop-up shown during registration. The user must tick
 * "I Agree" before the confirm button unlocks; `onAgree` continues sign-up.
 */
export function TermsModal({
  content,
  onAgree,
  onClose,
}: {
  content: string;
  onAgree: () => void;
  onClose: () => void;
}) {
  const [ticked, setTicked] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-ink-100 p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50">
              <ScrollText className="h-5 w-5 text-brand-600" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-ink-900">Terms &amp; Conditions</h3>
              <p className="text-xs text-ink-400">Consent and Participation Agreement</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <TermsBody content={content} />
        </div>

        <div className="space-y-3 border-t border-ink-100 p-5">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={ticked}
              onChange={(e) => setTicked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600"
            />
            <span className="text-sm font-medium text-ink-700">
              I have read and understood the Terms &amp; Conditions, and I agree to them.
            </span>
          </label>
          <div className="flex gap-2">
            <Button
              onClick={onAgree}
              disabled={!ticked}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-grape-600 hover:from-brand-700 hover:to-grape-700"
            >
              I Agree
            </Button>
            <button
              onClick={onClose}
              className="rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-600 hover:bg-ink-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
