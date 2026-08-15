"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Clock,
  Award,
  MessageSquare,
  TrendingUp,
  Target,
} from "lucide-react";

import { useCatalog } from "@/hooks/useCourses";
import { useSettings, youtubeEmbedUrl } from "@/hooks/useSettings";
import { useAuth } from "@/store/auth";

// Components
import ThreeGirdDisplay from "@/components/Homepage/ThreeGridDisplay";
import HeroSection from "@/components/Homepage/HeroSection";
import IntroVideoSection from "@/components/Homepage/IntroVideoSection";
import FoundationSection from "@/components/Homepage/FoundationSection";
import OurCoursesSection from "@/components/Homepage/OurCoursesSection";
import JoinCTASection from "@/components/Homepage/JoinCTASection";
import SideDecor from "@/components/Homepage/SideDecor";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Short benefit points listed below the foundation logo. */
const BENEFITS = [
  {
    text: "Learn anytime",
    icon: Clock,
    color: "text-teal-500",
    bg: "bg-teal-50",
    ring: "ring-teal-300",
  },
  {
    text: "Self-paced drills",
    icon: Award,
    color: "text-amber-500",
    bg: "bg-amber-50",
    ring: "ring-amber-300",
  },
  {
    text: "Coach feedback",
    icon: MessageSquare,
    color: "text-amber-500",
    bg: "bg-amber-50",
    ring: "ring-amber-300",
  },
  {
    text: "Track progress",
    icon: TrendingUp,
    color: "text-teal-600",
    bg: "bg-teal-50",
    ring: "ring-teal-300",
  },
  {
    text: "Match-ready skills",
    icon: Target,
    color: "text-rose-gold-600",
    bg: "bg-red-50",
    ring: "ring-red-300",
  },
];

/** Hover handlers that scale a CTA and nudge its trailing arrow. */
function useCtaHover() {
  const enter = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1.05,
      duration: 0.3,
      ease: "power3.out",
    });

    gsap.to(e.currentTarget.querySelector("[data-arrow]"), {
      x: 5,
      duration: 0.3,
      ease: "power3.out",
    });
  };

  const leave = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      duration: 0.3,
      ease: "power3.out",
    });

    gsap.to(e.currentTarget.querySelector("[data-arrow]"), {
      x: 0,
      duration: 0.3,
      ease: "power3.out",
    });
  };

  return {
    onMouseEnter: enter,
    onMouseLeave: leave,
  };
}

export default function HomePage() {
  const { data: courses } = useCatalog();
  const { settings } = useSettings();

  const featured = courses?.slice(0, 4) ?? [];
  const account = useAuth((s) => s.account);
  const cta = useCtaHover();

  const root = useRef<HTMLDivElement>(null);

  const hero = settings?.hero ?? {};
  const introVideo = hero.introVideoUrl;
  const heroVideo = youtubeEmbedUrl(hero.videoUrl);

  const foundationSite = settings?.foundation?.websiteUrl;
  const foundationVideo = settings?.foundation?.youtubeUrl;
  const foundationImage = settings?.foundation?.imageUrl;

  useGSAP(
    () => {
      // Hero entrance
      gsap.from(".hero-anim", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
      });

      // Ball entrance
      gsap.from(".hero-ball", {
        scale: 0,
        opacity: 0,
        duration: 0.9,
        ease: "back.out(1.6)",
        delay: 0.2,
      });

      // Orbit animation
      gsap.to(".orbit", {
        rotation: 360,
        repeat: -1,
        duration: 22,
        ease: "none",
      });

      gsap.to(".satellite", {
        rotation: -360,
        repeat: -1,
        duration: 22,
        ease: "none",
      });

      // Scroll-triggered reveals
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          },
        });
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative">
      {/* ───────── Side decoration ───────── */}
      <SideDecor />

      {/* Very faint brand icons behind everything */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      >
        <Image
          src="/brand/ball.png"
          alt=""
          width={900}
          height={900}
          className="absolute -right-40 top-10 w-[600px] max-w-none opacity-[0.04]"
          priority
        />

        <Image
          src="/brand/logo.png"
          alt=""
          width={700}
          height={700}
          className="absolute -left-40 bottom-0 w-[460px] max-w-none opacity-[0.035]"
        />
      </div>

      <HeroSection hero={hero} cta={cta} />

      <ThreeGirdDisplay />

      <IntroVideoSection
        introVideo={introVideo ?? undefined}
        heroVideo={heroVideo ?? undefined}
      />

      <FoundationSection
        foundationSite={foundationSite}
        foundationVideo={foundationVideo}
        foundationImage={foundationImage}
        benefits={BENEFITS}
        cta={cta}
      />

      <OurCoursesSection featured={featured} />

      <JoinCTASection account={account} cta={cta} />
    </div>
  );
}