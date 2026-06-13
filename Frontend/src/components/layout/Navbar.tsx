"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { useAuth } from "@/store/auth";
import { useSettings } from "@/hooks/useSettings";

/**
 * Nav link with a "top + bottom bar" hover animation: two bars slide in from the
 * edges (top bar from the left, bottom bar from the right) and meet across the
 * label, then retract on leave. Driven by GSAP.
 */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const top = useRef<HTMLSpanElement>(null);
  const bottom = useRef<HTMLSpanElement>(null);

  const enter = () => {
    gsap.to(top.current, { scaleX: 1, transformOrigin: "left", duration: 0.3, ease: "power3.out" });
    gsap.to(bottom.current, { scaleX: 1, transformOrigin: "right", duration: 0.3, ease: "power3.out" });
  };
  const leave = () => {
    gsap.to(top.current, { scaleX: 0, transformOrigin: "right", duration: 0.3, ease: "power3.in" });
    gsap.to(bottom.current, { scaleX: 0, transformOrigin: "left", duration: 0.3, ease: "power3.in" });
  };

  return (
    <Link
      href={href}
      onMouseEnter={enter}
      onMouseLeave={leave}
      className="relative inline-block px-0.5 py-1 transition-colors hover:text-brand-700"
    >
      <span
        ref={top}
        aria-hidden
        className="absolute left-0 top-0 h-0.5 w-full origin-left scale-x-0 rounded bg-gradient-to-r from-brand-600 to-grape-600"
      />
      {children}
      <span
        ref={bottom}
        aria-hidden
        className="absolute bottom-0 left-0 h-0.5 w-full origin-right scale-x-0 rounded bg-gradient-to-r from-grape-600 to-brand-600"
      />
    </Link>
  );
}

export function Navbar() {
  const account = useAuth((s) => s.account);
  const { settings } = useSettings();
  const dashHref = account?.kind === "admin" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/logo.png" alt={settings.platformName} width={34} height={34} />
          <span className="font-extrabold text-ink-900">{settings.platformName}</span>
        </Link>
        <div className="flex items-center gap-5 text-sm font-medium text-ink-600">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/catalog">Courses</NavLink>
          <NavLink href="/about">About us</NavLink>
          {account ? (
            <Link href={dashHref} className="rounded-lg bg-gradient-to-r from-brand-600 to-grape-600 px-4 py-1.5 font-semibold text-white">
              {account.kind === "admin" ? "Admin" : "Dashboard"}
            </Link>
          ) : (
            <Link href="/login" className="rounded-lg bg-gradient-to-r from-brand-600 to-grape-600 px-4 py-1.5 font-semibold text-white">
              Login / Register
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  const { settings } = useSettings();
  const { platformName, email, contactPhone, place } = settings;

  return (
    <footer className="border-t border-ink-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-500">
        <div className="flex items-center gap-2">
          <Image src="/brand/ball.png" alt="" width={20} height={20} />
          <span className="font-semibold text-ink-700">{platformName}</span>
        </div>
        {(email || contactPhone || place) && (
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-500">
            {email && <a href={`mailto:${email}`} className="hover:text-brand-700">{email}</a>}
            {contactPhone && <a href={`tel:${contactPhone}`} className="hover:text-brand-700">{contactPhone}</a>}
            {place && <span>{place}</span>}
          </div>
        )}
        <p className="mt-2 text-xs text-ink-400">
          © {new Date().getFullYear()} {platformName}. Learn cricket, the right way.
        </p>
      </div>
    </footer>
  );
}
