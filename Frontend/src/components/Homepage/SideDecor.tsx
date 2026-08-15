/**
 * Decorative columns that flank the centered content on wide
 * screens so the empty gutters no longer look bare.
 */
export default function SideDecor() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 hidden xl:block"
    >
      {/* Left rail */}
      <div className="absolute left-0 top-0 h-full w-[max(0px,calc((100%-72rem)/2))]">
        <div className="absolute left-10 top-40 h-24 w-24 rounded-full bg-teal-300/20 blur-2xl" />

        <div className="absolute left-16 top-[55%] h-16 w-16 rounded-2xl bg-amber-400/15 blur-xl" />

        <div className="absolute bottom-32 left-12 h-20 w-20 rounded-full border border-teal-200/60" />

        <div className="absolute left-24 top-[40%] h-3 w-3 rounded-full bg-amber-400/60" />

        <div className="absolute left-8 top-[70%] h-2.5 w-2.5 rounded-full bg-amber-400/50" />
      </div>

      {/* Right rail */}
      <div className="absolute right-0 top-0 h-full w-[max(0px,calc((100%-72rem)/2))]">
        <div className="absolute right-12 top-52 h-28 w-28 rounded-full bg-amber-400/15 blur-2xl" />

        <div className="absolute right-16 top-[60%] h-16 w-16 rounded-full bg-amber-300/30 blur-xl" />

        <div className="absolute right-10 top-24 h-20 w-20 rounded-2xl border border-amber-400/40" />

        <div className="absolute right-24 top-[45%] h-3 w-3 rounded-full bg-teal-400/60" />

        <div className="absolute bottom-40 right-8 h-2.5 w-2.5 rounded-full bg-amber-400/60" />
      </div>
    </div>
  );
}
