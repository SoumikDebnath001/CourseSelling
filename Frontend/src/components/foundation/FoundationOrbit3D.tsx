"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useInView } from "@/hooks/useInView";

/**
 * three.js + react-three-fiber are heavy, so the WebGL scene lives in its own
 * chunk that is only fetched once the section approaches the viewport.
 */
const FoundationOrbitScene = dynamic(() => import("./FoundationOrbitScene"), {
  ssr: false,
});

export interface FoundationOrbit3DProps {
  logoSrc?: string;
  /** Texture used for the logo inside the WebGL scene (a small, pre-sized copy). */
  logoTextureSrc?: string;
  className?: string;
}

/**
 * 3D centrepiece for the foundation section: the logo floats at the centre while
 * cricket-gear icons orbit it on a tilted ring with real depth, lighting and a
 * gentle pointer parallax. Renders client-side only; a static logo is shown until
 * the WebGL scene is ready. The scene is mounted lazily and its render loop is
 * paused whenever it scrolls off-screen.
 */
export default function FoundationOrbit3D({
  logoSrc = "/brand/logo.png",
  logoTextureSrc = "/brand/orbit/logo.webp",
  className = "",
}: FoundationOrbit3DProps) {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const { ref, inView, seen } = useInView<HTMLDivElement>("400px");

  return (
    <div ref={ref} className={`relative ${className}`}>
      {seen && (
        <FoundationOrbitScene logoSrc={logoTextureSrc} active={inView} onReady={onReady} />
      )}

      {/* Static fallback shown until the scene paints (and for no-WebGL). */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-2xl ring-[8px] ring-teal-50 sm:h-52 sm:w-52">
          <Image
            src={logoSrc}
            alt="Foundation"
            width={220}
            height={220}
            className="h-24 w-24 animate-pulse object-contain sm:h-32 sm:w-32"
          />
        </div>
      </div>
    </div>
  );
}
