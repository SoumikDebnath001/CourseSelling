"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaXTwitter,
  FaLinkedinIn,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import { useSettings } from "@/hooks/useSettings";
import type { Settings } from "@/types/api";

/** Maps each configurable social key to its brand glyph + label. */
const SOCIAL_DEFS: { key: keyof Settings["socials"]; Icon: IconType; label: string }[] = [
  { key: "whatsapp", Icon: FaWhatsapp, label: "WhatsApp" },
  { key: "instagram", Icon: FaInstagram, label: "Instagram" },
  { key: "facebook", Icon: FaFacebookF, label: "Facebook" },
  { key: "youtube", Icon: FaYoutube, label: "YouTube" },
  { key: "twitter", Icon: FaXTwitter, label: "X (Twitter)" },
  { key: "linkedin", Icon: FaLinkedinIn, label: "LinkedIn" },
];

/** Reveals its target once when scrolled into view (drives the intro animation). */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

export function Footer() {
  const { settings } = useSettings();
  const { platformName, email, contactPhone, place, footer, socials, socialOrder } = settings;
  const { ref, inView } = useInView<HTMLDivElement>();

  const socialItems = SOCIAL_DEFS.map((d, i) => ({
    ...d,
    url: socials?.[d.key],
    // Admin-set order wins; fall back to the default definition order.
    order: socialOrder?.[d.key] ?? i,
  }))
    .filter((d): d is typeof d & { url: string } => Boolean(d.url))
    .sort((a, b) => a.order - b.order);

  const about =
    footer?.about ||
    "Empowering the next generation through sport — online coaching, structured progression and direct coach feedback, anywhere you are.";

  return (
    <footer className="relative overflow-hidden bg-ink-900 text-white">
      {/* gradient hairline along the very top */}
      <div aria-hidden className="h-[3px] w-full bg-gradient-to-r from-brand-500 via-grape-500 to-brand-500" />

      {/* soft brand glows + violet tint */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand-900/40" />
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-grape-600/20 blur-3xl" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-3xl px-6 py-14">
        <div className="flex flex-col items-center text-center">
          {/* ── Logo (centered) ── */}
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.4rem] bg-gradient-to-br from-brand-500 to-grape-500 p-[3px] shadow-lg shadow-brand-600/30">
            <span className="grid h-full w-full place-items-center rounded-[1.2rem] bg-ink-900">
              <Image src="/brand/logo.png" alt={platformName} width={56} height={56} className="h-12 w-12 object-contain" />
            </span>
          </span>

          {/* ── About (no heading) ── */}
          <p className="mt-7 max-w-xl text-sm leading-relaxed text-white/60">{about}</p>

          {/* ── Contacts (no heading) ── */}
          <ul className="mt-8 flex flex-col items-center gap-3 text-sm text-white/75 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-3">
            {place && (
              <li className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                  <MapPin className="h-3.5 w-3.5 text-brand-300" />
                </span>
                <span>{place}</span>
              </li>
            )}
            {contactPhone && (
              <li className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                  <Phone className="h-3.5 w-3.5 text-brand-300" />
                </span>
                <a href={`tel:${contactPhone}`} className="transition-colors hover:text-white">
                  {contactPhone}
                </a>
              </li>
            )}
            {email && (
              <li className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                  <Mail className="h-3.5 w-3.5 text-brand-300" />
                </span>
                <a href={`mailto:${email}`} className="break-all transition-colors hover:text-white">
                  {email}
                </a>
              </li>
            )}
          </ul>

          {/* ── Social icons (centered, last) ── */}
          {socialItems.length > 0 && (
            <ul className={`social-row mt-9 flex flex-wrap justify-center gap-3 ${inView ? "is-in" : ""}`}>
              {socialItems.map((s, i) => (
                <li
                  key={s.key}
                  className="social-item"
                  style={{ ["--i" as string]: i } as React.CSSProperties}
                >
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="group relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/85 transition-all duration-300 hover:border-transparent hover:bg-gradient-to-br hover:from-brand-500 hover:to-grape-500 hover:text-white hover:shadow-lg hover:shadow-brand-500/30"
                  >
                    <s.Icon className="h-[18px] w-[18px]" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {platformName}. All rights reserved.
          </p>
          <p>Learn the game, the right way.</p>
        </div>
      </div>

      {/* Social-icon intro (stagger scale-up) + perpetual float. GPU-only props. */}
      <style jsx>{`
        @keyframes social-appear {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes social-float {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-7px) scale(1.05);
          }
        }
        .social-item {
          opacity: 0;
          will-change: transform, opacity;
        }
        .social-item :global(a) {
          box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.65);
        }
        /* Only animate once the footer scrolls into view. */
        .social-row.is-in .social-item {
          animation:
            social-appear 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--i) * 120ms) forwards,
            social-float 4.5s ease-in-out calc(1.3s + var(--i) * 0.45s) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .social-item {
            opacity: 1;
          }
          .social-row.is-in .social-item {
            animation: none;
          }
        }
      `}</style>
    </footer>
  );
}
