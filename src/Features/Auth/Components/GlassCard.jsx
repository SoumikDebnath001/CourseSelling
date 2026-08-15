import React from "react";

export const GlassCard = ({ children, className = "", hoverEffect = true }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/20 bg-stone-900/60 p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl transition-all duration-500 ${
        hoverEffect ? "hover:border-amber-500/40 hover:shadow-[0_12px_40px_0_rgba(139,107,67,0.25)] hover:-translate-y-1" : ""
      } ${className}`}
    >
      {/* Subtle top inner shine */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GlassCard;
