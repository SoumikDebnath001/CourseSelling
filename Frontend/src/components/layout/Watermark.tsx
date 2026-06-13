"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSettings } from "@/hooks/useSettings";

/**
 * Faint academy-icon watermark shown behind the content of every page EXCEPT the
 * home page (which has its own bespoke background). Driven by admin settings —
 * admins can toggle it off or tune its opacity.
 */
export function Watermark() {
  const pathname = usePathname();
  const { settings } = useSettings();

  // Home ("/") opts out — it ships its own decorative background.
  if (pathname === "/") return null;
  if (!settings.watermark?.enabled) return null;

  const opacity = settings.watermark.opacity ?? 0.04;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        src="/brand/logo.png"
        alt=""
        width={900}
        height={900}
        className="absolute left-1/2 top-1/2 w-[70vmin] max-w-none -translate-x-1/2 -translate-y-1/2"
        style={{ opacity }}
        priority
      />
    </div>
  );
}
