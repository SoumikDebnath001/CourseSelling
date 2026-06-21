"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSettings } from "@/hooks/useSettings";

/**
 * Faint academy-icon watermark shown behind the content of every page EXCEPT the
 * home page (which has its own bespoke background) and the course-watching pages
 * (where it would overlap the video). Driven by admin settings — admins can toggle
 * it off or tune its opacity.
 */
export function Watermark() {
  const pathname = usePathname();
  const { settings } = useSettings();

  // Home ("/") opts out — it ships its own decorative background.
  if (pathname === "/") return null;
  // Course-watching pages opt out — the watermark would sit over the video.
  if (pathname.startsWith("/learn")) return null;
  if (!settings.watermark?.enabled) return null;

  const opacity = settings.watermark.opacity ?? 0.04;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
      <Image
        src="/brand/logo.png"
        alt=""
        width={900}
        height={900}
        className="w-[70vmin] max-w-none"
        style={{ opacity }}
        priority
      />
    </div>
  );
}
