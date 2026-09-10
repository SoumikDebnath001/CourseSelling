"use client";

import Image from "next/image";
import type { Sponsor } from "@/types";

interface SponsorsShowcaseProps {
  sponsors: Sponsor[];
}

export function SponsorsShowcase({ sponsors }: SponsorsShowcaseProps) {
  if (!sponsors || sponsors.length === 0) return null;

  return (
    <section
      aria-label="Our Sponsors"
      className="relative py-20 overflow-hidden w-full bg-[url('/homepage/HomeHero2.png')] bg-fixed bg-cover bg-center"
    >
      {/* Full width frosted glass overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>
      <style>{`
        @keyframes sponsor-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-10px) scale(1.04); }
        }
        @keyframes sponsor-shimmer {
          0%   { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(220%)  skewX(-18deg); }
        }

        .sponsor-item {
          position: relative;
          overflow: hidden;
        }
        .sponsor-logo {
          opacity: 1;
          filter: grayscale(0%);
          animation: sponsor-float 3s ease-in-out infinite;
          transition: filter 0.35s ease;
        }
        .sponsor-logo:hover {
          filter: drop-shadow(0 0 18px rgba(245, 158, 11, 0.5)) brightness(1.2);
          animation-play-state: paused;
        }
        .sponsor-item:nth-child(2n) .sponsor-logo { animation-delay: -1.5s; }
        .sponsor-item:nth-child(3n) .sponsor-logo { animation-delay: -0.8s; }
        .sponsor-item:nth-child(4n) .sponsor-logo { animation-delay: -2.1s; }
        .sponsor-item:nth-child(5n) .sponsor-logo { animation-delay: -0.4s; }

        /* Shimmer streak */
        .sponsor-shimmer {
          display: block;
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 35%,
            rgba(255, 255, 255, 0.45) 50%,
            transparent 65%
          );
          animation: sponsor-shimmer 2.8s ease-in-out infinite;
          pointer-events: none;
          z-index: 2;
        }
        .sponsor-item:nth-child(2n) .sponsor-shimmer { animation-delay: -1.4s; }
        .sponsor-item:nth-child(3n) .sponsor-shimmer { animation-delay: -0.7s; }
        .sponsor-item:nth-child(4n) .sponsor-shimmer { animation-delay: -2.1s; }
        .sponsor-item:nth-child(5n) .sponsor-shimmer { animation-delay: -0.3s; }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-block px-8 py-8 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p className="text-amber-400 text-xs uppercase tracking-wider font-semibold mb-3">
              Our Partners
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-cream-50 leading-tight">
              Sponsors & Partners
            </h2>
            <p className="text-cream-300 mt-3 text-base leading-relaxed max-w-md mx-auto">
              Proud to be supported by organisations that share our vision of community transformation.
            </p>
          </div>
        </div>

        {/* Sponsor logos — 2 per row on mobile, free-flow on larger screens */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap justify-center items-center gap-8 md:gap-14 lg:gap-20">
          {sponsors.map((sponsor) => {
            const inner = (
              <>
                <span className="sponsor-shimmer" aria-hidden="true" />
                {sponsor.imageUrl?.url ? (
                  <Image
                    src={sponsor.imageUrl.url}
                    alt={sponsor.name}
                    width={320}
                    height={160}
                    className="sponsor-logo object-contain h-28 sm:h-32 md:h-40 max-w-40 sm:max-w-55 md:max-w-[320px] mx-auto"
                    style={{ width: "auto" }}
                  />
                ) : (
                  <span className="sponsor-logo text-lg sm:text-xl md:text-2xl font-bold text-cream-100 tracking-wide text-center block">
                    {sponsor.name}
                  </span>
                )}
              </>
            );

            return sponsor.websiteUrl ? (
              <a
                key={sponsor._id}
                href={sponsor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={sponsor.name}
                className="sponsor-item flex items-center justify-center"
              >
                {inner}
              </a>
            ) : (
              <div key={sponsor._id} className="sponsor-item flex items-center justify-center">
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
