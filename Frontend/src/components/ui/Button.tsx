"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Variant = "primary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary: "bg-pitch-600 text-white hover:bg-pitch-700",
  ghost: "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
  danger: "bg-ball-600 text-white hover:bg-ball-700",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", loading, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
        styles[variant],
        className
      )}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4 text-current" />}
      {children}
    </button>
  );
});
