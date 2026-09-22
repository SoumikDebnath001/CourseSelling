"use client";

import { useEffect, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { markAppLoaded } from "@/lib/appLoader";

/** Keep the loader up at least this long so it never just flashes. */
const MIN_VISIBLE_MS = 600;
/** Never block the site longer than this, even if an image or request hangs. */
const MAX_VISIBLE_MS = 8000;
/** Must match the fade-out `duration-*` class below. */
const FADE_MS = 500;

/**
 * Full-screen bouncing-cricket-ball loader shown on every full page load (not
 * on client-side navigation). It is server-rendered, and the SVG animates on
 * its own, so it appears instantly — before any JS runs. It fades out once:
 *  - the window `load` event has fired (priority images, CSS, scripts),
 *  - web fonts are ready,
 *  - the initial API queries (settings, catalog, …) have settled,
 * then signals `markAppLoaded()` so entrance animations start in view.
 */
export function AppLoader() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");
  const [assetsReady, setAssetsReady] = useState(false);
  const fetching = useIsFetching();

  // Wait for window load + fonts; start the hard cap.
  useEffect(() => {
    let cancelled = false;

    const windowLoaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) =>
            window.addEventListener("load", () => resolve(), { once: true })
          );
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    Promise.all([windowLoaded, fontsReady]).then(() => {
      if (!cancelled) setAssetsReady(true);
    });

    const cap = window.setTimeout(() => setPhase((p) => (p === "visible" ? "fading" : p)), MAX_VISIBLE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(cap);
    };
  }, []);

  // Assets loaded and no requests in flight → fade out (after the minimum time
  // and two frames, so the page has actually painted behind the loader).
  useEffect(() => {
    if (phase !== "visible" || !assetsReady || fetching > 0) return;

    let raf = 0;
    const wait = Math.max(0, MIN_VISIBLE_MS - performance.now());
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setPhase("fading"));
      });
    }, wait);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [phase, assetsReady, fetching]);

  useEffect(() => {
    if (phase !== "fading") return;
    markAppLoaded();
    const timer = window.setTimeout(() => setPhase("gone"), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      id="app-loader"
      role="status"
      aria-label="Loading"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500 ${
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- animated SVG must load as-is, before hydration */}
      <img
        src="/loader/bouncing-cricket-ball.svg"
        alt=""
        width={160}
        height={160}
        fetchPriority="high"
        className="h-32 w-32 sm:h-40 sm:w-40"
      />
    </div>
  );
}
