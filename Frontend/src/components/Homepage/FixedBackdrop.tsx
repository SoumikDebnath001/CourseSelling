import { cn } from "@/lib/utils";

/**
 * Parallax "fixed" photo backdrop with a frosted dark overlay.
 *
 * Visually matches `bg-fixed` + an overlay with `backdrop-blur`, but is far
 * cheaper to scroll: `background-attachment: fixed` and `backdrop-filter`
 * force the browser to repaint and re-blur the whole section on every scroll
 * frame. Here the photo lives on its own `position: fixed` layer (clipped to
 * the section via `clip-path`), and the blur is a plain `filter` on that
 * static layer — rasterised once, then just composited while scrolling.
 */
export default function FixedBackdrop({
  src = "/homepage/HomeHero2.webp",
  blur = "blur-sm",
  overlay = "bg-black/40",
}: {
  src?: string;
  /** Tailwind `blur-*` class matching the old overlay's `backdrop-blur-*`. */
  blur?: string;
  /** Tailwind background class for the dark tint. */
  overlay?: string;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 [clip-path:inset(0)]"
    >
      {/* Oversized by a few px so the blurred edges stay off-screen. */}
      <div
        className={cn(
          "fixed -inset-4 bg-cover bg-center [transform:translateZ(0)]",
          blur
        )}
        style={{ backgroundImage: `url('${src}')` }}
      />
      <div className={cn("absolute inset-0", overlay)} />
    </div>
  );
}
