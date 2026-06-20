"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { 
  ArrowRight, Quote, PlayCircle, Youtube, HeartHandshake, ExternalLink, Globe,
  Clock, Award, MessageSquare, TrendingUp, Target
} from "lucide-react";
import { useCatalog } from "@/hooks/useCourses";
import { useSettings, youtubeEmbedUrl } from "@/hooks/useSettings";
import { CourseCard } from "@/components/course/CourseCard";
import { useAuth } from "@/store/auth";
import Counter from "@/components/ui/Counter";

/** 3D orbital centrepiece — WebGL, so load it client-side only. */
const FoundationOrbit3D = dynamic(() => import("@/components/foundation/FoundationOrbit3D"), {
  ssr: false,
});

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Short benefit points listed below the foundation logo. */
const BENEFITS = [
  {
    text: "Learn anytime",
    icon: Clock,
    color: "text-brand-500",
    bg: "bg-brand-50",
    ring: "ring-brand-300",
  },
  {
    text: "Self-paced drills",
    icon: Award,
    color: "text-sun-500",
    bg: "bg-sun-50",
    ring: "ring-sun-300",
  },
  {
    text: "Coach feedback",
    icon: MessageSquare,
    color: "text-grape-500",
    bg: "bg-grape-50",
    ring: "ring-grape-300",
  },
  {
    text: "Track progress",
    icon: TrendingUp,
    color: "text-brand-600",
    bg: "bg-brand-50",
    ring: "ring-brand-300",
  },
  {
    text: "Match-ready skills",
    icon: Target,
    color: "text-ball-600",
    bg: "bg-red-50",
    ring: "ring-red-300",
  },
];

/** Hover handlers that scale a CTA and nudge its trailing arrow (GSAP). */
function useCtaHover() {
  const enter = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, { scale: 1.05, duration: 0.3, ease: "power3.out" });
    gsap.to(e.currentTarget.querySelector("[data-arrow]"), { x: 5, duration: 0.3, ease: "power3.out" });
  };
  const leave = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: "power3.out" });
    gsap.to(e.currentTarget.querySelector("[data-arrow]"), { x: 0, duration: 0.3, ease: "power3.out" });
  };
  return { onMouseEnter: enter, onMouseLeave: leave };
}

export default function HomePage() {
  const { data: courses } = useCatalog();
  const { settings } = useSettings();
  const featured = courses?.slice(0, 3) ?? [];
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
      // Hero entrance — staggered reveal of the headline column.
      gsap.from(".hero-anim", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.12 });

      // The ball pops in, then its surrounding elements begin orbiting forever.
      gsap.from(".hero-ball", { scale: 0, opacity: 0, duration: 0.9, ease: "back.out(1.6)", delay: 0.2 });
      gsap.to(".orbit", { rotation: 360, repeat: -1, duration: 22, ease: "none" });
      gsap.to(".satellite", { rotation: -360, repeat: -1, duration: 22, ease: "none" });

      // Scroll-triggered reveals for every section block.
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, { y: 40, opacity: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative overflow-x-clip">
      {/* ───────── Side decoration (fills the wide desktop gutters) ───────── */}
      <SideDecor />

      {/* very faint brand icons behind everything */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
        <Image src="/brand/ball.png" alt="" width={900} height={900} className="absolute -right-40 top-10 w-[600px] max-w-none opacity-[0.04]" priority />
        <Image src="/brand/logo.png" alt="" width={700} height={700} className="absolute -left-40 bottom-0 w-[460px] max-w-none opacity-[0.035]" />
      </div>

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-brand-200/60 blur-2xl" />
          <div className="absolute right-1/3 top-0 h-24 w-24 rounded-full bg-sun-300/50 blur-xl" />
          <div className="absolute bottom-0 right-10 h-48 w-48 rounded-full bg-grape-400/30 blur-2xl" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-2 lg:gap-10 lg:py-16">
          <div className="text-center lg:text-left">
            <span className="hero-anim inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {hero.badge || "🏏 Obuya Grassroots E-Learning"}
            </span>
            <h1 className="hero-anim mt-4 text-4xl font-extrabold leading-tight text-ink-900 sm:text-5xl">
              {hero.title || (
                <>
                  <span className="rounded-lg bg-ink-900 px-2 text-white">Train</span> at Home with the{" "}
                  <span className="rounded-lg bg-grape-500 px-2 text-white">Best</span> Coaches
                </>
              )}
              {hero.title && hero.highlight && (
                <> <span className="rounded-lg bg-grape-500 px-2 text-white">{hero.highlight}</span></>
              )}
            </h1>
            <p className="hero-anim mx-auto mt-4 max-w-md text-sm text-ink-500 sm:text-base lg:mx-0">
              {hero.subtitle ||
                "Learn batting, bowling and match craft at your own pace — HD video lessons, module tests and direct coach feedback, anytime you want."}
            </p>

            <div className="hero-anim mt-6 flex flex-col flex-wrap justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/catalog" {...cta} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-grape-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-600/20 sm:w-auto">
                Get started <ArrowRight data-arrow className="h-4 w-4" />
              </Link>
              <Link href="/about" {...cta} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-6 py-3 font-semibold text-ink-700 sm:w-auto">
                Learn more
              </Link>
            </div>

            <div className="hero-anim mt-10 grid grid-cols-3 gap-2 sm:flex sm:justify-center sm:gap-12 lg:justify-start">
              {[
                { value: 3000, suffix: "+", l: "Students" },
                { value: 10, suffix: "+", l: "Years coaching" },
                { value: 25, suffix: "+", l: "Pro mentors" },
              ].map((s) => (
                <div key={s.l} className="flex min-w-0 flex-col items-center sm:items-start gap-1">
                  <div className="flex items-center text-2xl font-extrabold text-ink-900 sm:text-3xl">
                    <Counter value={s.value} fontSize={30} padding={0} gap={1} horizontalPadding={0} textColor="inherit" fontWeight="inherit" gradientHeight={0} />
                    <span>{s.suffix}</span>
                  </div>
                  <p className="text-xs font-medium text-ink-500 uppercase tracking-wider">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual: a ball with elements orbiting around it. */}
          <div className="relative mx-auto mt-12 h-64 w-64 sm:h-72 sm:w-72 lg:mt-0 lg:h-80 lg:w-80">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-grape-500" />
            <div className="orbit absolute inset-0">
              <div className="satellite absolute -right-2 top-4 h-16 w-16 rounded-full bg-sun-400 sm:-right-4 sm:top-6 sm:h-20 sm:w-20" />
              <div className="satellite absolute -left-4 bottom-6 h-12 w-12 rounded-2xl bg-brand-300 sm:-left-6 sm:bottom-10 sm:h-16 sm:w-16" />
              <div className="satellite absolute right-6 -bottom-2 h-10 w-10 rounded-full border-4 border-grape-400 bg-white sm:right-8 sm:-bottom-4 sm:h-12 sm:w-12" />
              <div className="satellite absolute left-8 -top-2 h-8 w-8 rounded-full bg-grape-300 sm:left-10 sm:-top-4 sm:h-10 sm:w-10" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/brand/ball.png" alt="" width={150} height={150} className="hero-ball h-[100px] w-[100px] drop-shadow-xl sm:h-[130px] sm:w-[130px] lg:h-[150px] lg:w-[150px]" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Intro video (moved here, full feature band) ───────── */}
      <section className="reveal mx-auto max-w-5xl px-4 py-8 lg:py-12">
        <div className="mb-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-grape-50 px-3 py-1 text-xs font-semibold text-grape-700">
            <PlayCircle className="h-4 w-4" /> Watch the intro
          </span>
          <h2 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">See the academy in action</h2>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-300/40 to-grape-400/30 blur-xl" />
          <div className="aspect-video overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-brand-100 to-grape-400/15 shadow-card">
            {introVideo ? (
              <video className="h-full w-full bg-black object-contain" src={introVideo} controls playsInline poster="/brand/logo.png" />
            ) : heroVideo ? (
              <iframe
                className="h-full w-full"
                src={heroVideo}
                title="Intro video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <PlayCircle className="h-16 w-16 text-brand-500/70 sm:h-20 sm:w-20" />
              </div>
            )}
          </div>
        </div>
      </section>

       <section className="reveal mx-auto w-full px-2 py-10 sm:px-4 lg:py-14">
        <div className="relative mx-auto w-full max-w-[1800px] overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-50 via-white to-grape-400/10 p-6 sm:p-12 lg:p-16 ring-1 ring-ink-100 shadow-2xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-96 w-96 rounded-full bg-grape-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-96 w-96 rounded-full bg-brand-300/20 blur-3xl" />

          <div className="relative flex flex-col items-center gap-16 lg:gap-24">
            {/* Top: text content */}
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full bg-grape-100 px-4 py-2 text-sm font-bold text-grape-700 shadow-sm">
                <HeartHandshake className="h-4 w-4" /> Our Foundation
              </span>
              <h2 className="mt-6 text-4xl font-extrabold text-ink-900 sm:text-5xl lg:text-6xl tracking-tight">More than an academy</h2>
              <p className="mx-auto mt-6 max-w-2xl text-base text-ink-600 sm:text-lg leading-relaxed">
                Beyond online coaching, our foundation brings cricket to children who can&apos;t afford it.
                Every learner here helps put a bat in another kid&apos;s hands — explore our work and join in.
              </p>
            </div>

            {/* Middle: 3D cricket-gear icons orbiting the foundation logo */}
            <div className="flex w-full flex-col items-center gap-8 py-2 lg:gap-12 lg:py-6">
              <FoundationOrbit3D className="h-80 w-full max-w-2xl sm:h-[30rem]" />

              {/* element points, listed below the logo */}
              <div className="flex max-w-3xl flex-wrap items-center justify-center gap-3 sm:gap-4">
                {BENEFITS.map((b) => (
                  <div
                    key={b.text}
                    className={`flex items-center gap-2.5 rounded-full bg-white/80 px-4 py-2.5 shadow-md backdrop-blur-md border border-white/80 ring-1 ${b.ring}`}
                  >
                    <span className={`rounded-xl p-1.5 ${b.bg} ring-1 ring-black/5`}>
                      <b.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${b.color}`} />
                    </span>
                    <span className="text-sm font-extrabold tracking-wide text-ink-800 whitespace-nowrap sm:text-base">
                      {b.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: foundation image and links side by side */}
            <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2 mt-4 lg:mt-8">
              <div className="overflow-hidden rounded-3xl bg-ink-100 shadow-xl ring-1 ring-ink-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="aspect-[16/10] w-full relative">
                  {foundationImage ? (
                    <Image src={foundationImage} alt="Our foundation" width={640} height={400} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-ink-50 text-ink-400">
                      <Image src="/brand/logo.png" alt="" width={60} height={60} className="h-12 w-12 opacity-30 grayscale" />
                      <span className="text-sm font-medium">Foundation image</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-5 justify-center px-4 md:px-0">
                <h3 className="text-2xl font-bold text-ink-900">Make an Impact</h3>
                <p className="text-base text-ink-600 leading-relaxed">
                  See how we are changing lives through cricket. Visit our foundation website or watch our documentary to learn more about our ongoing initiatives.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row mt-4">
                  {foundationSite ? (
                    <a href={foundationSite} target="_blank" rel="noopener noreferrer" {...cta} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-grape-600 to-brand-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-grape-600/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
                      <Globe className="h-4 w-4" /> Visit Foundation <ExternalLink data-arrow className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-ink-400">Foundation website coming soon.</span>
                  )}
                  {foundationVideo && (
                    <a href={foundationVideo} target="_blank" rel="noopener noreferrer" {...cta} className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-8 py-3.5 font-semibold text-ink-700 hover:bg-ink-50 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md">
                      <PlayCircle className="h-5 w-5 text-grape-600" /> Watch Video
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Our courses ───────── */}
      {featured.length > 0 && (
        <section className="reveal mx-auto max-w-6xl px-4 py-10 lg:py-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">Our courses</h2>
              <p className="mt-2 text-sm text-ink-500 sm:text-base">Popular courses picked for you.</p>
            </div>
            <Link href="/catalog" className="flex items-center justify-center gap-1 text-sm font-semibold text-brand-700 sm:justify-start">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <CourseCard key={c._id} course={c} />)}
          </div>
        </section>
      )}

      {/* ───────── Testimonial ───────── */}
      {/* <section className="reveal mx-auto max-w-4xl px-4 py-10 lg:py-14">
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 text-center shadow-card sm:p-12 sm:text-left">
          <Quote className="mx-auto h-8 w-8 text-grape-300 sm:mx-0 sm:h-10 sm:w-10" />
          <p className="mt-4 text-base font-medium text-ink-800 sm:text-xl">
            “The video lessons feel like a coach is right there with me. The module tests keep me
            honest, and I can ask questions under each video. My batting has genuinely improved.”
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 sm:justify-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 sm:h-11 sm:w-11">A</div>
            <div className="text-left">
              <p className="text-sm font-semibold text-ink-900 sm:text-base">Alexander</p>
              <p className="text-xs text-ink-400 sm:text-sm">Academy student</p>
            </div>
          </div>
        </div>
      </section> */}

      {/* ───────── Join CTA (hidden once signed in) ───────── */}
      {!account && (
        <section className="reveal mx-auto max-w-6xl px-4 pb-12 sm:pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-grape-600 px-6 py-10 text-center sm:px-16 sm:py-12">
            <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/10 sm:h-32 sm:w-32" />
            <div className="pointer-events-none absolute -bottom-10 right-4 h-32 w-32 rounded-full bg-sun-400/20 sm:right-10 sm:h-40 sm:w-40" />
            <h2 className="relative text-2xl font-extrabold text-white sm:text-3xl">Let&apos;s join the academy</h2>
            <p className="relative mx-auto mt-2 max-w-md text-sm text-brand-100 sm:text-base">
              Create your free account and start learning cricket the right way today.
            </p>
            <Link href="/login" {...cta} className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-brand-700 sm:w-auto">
              Get started <ArrowRight data-arrow className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Decorative columns that flank the centered content on wide (xl+) screens so the empty
 * gutters no longer look bare. Purely visual and non-interactive.
 */
function SideDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden xl:block">
      {/* left rail */}
      <div className="absolute left-0 top-0 h-full w-[max(0px,calc((100%-72rem)/2))]">
        <div className="absolute left-10 top-40 h-24 w-24 rounded-full bg-brand-300/20 blur-2xl" />
        <div className="absolute left-16 top-[55%] h-16 w-16 rounded-2xl bg-grape-400/15 blur-xl" />
        <div className="absolute left-12 bottom-32 h-20 w-20 rounded-full border border-brand-200/60" />
        <div className="absolute left-24 top-[40%] h-3 w-3 rounded-full bg-sun-400/60" />
        <div className="absolute left-8 top-[70%] h-2.5 w-2.5 rounded-full bg-grape-400/50" />
      </div>
      {/* right rail */}
      <div className="absolute right-0 top-0 h-full w-[max(0px,calc((100%-72rem)/2))]">
        <div className="absolute right-12 top-52 h-28 w-28 rounded-full bg-grape-400/15 blur-2xl" />
        <div className="absolute right-16 top-[60%] h-16 w-16 rounded-full bg-sun-300/30 blur-xl" />
        <div className="absolute right-10 top-24 h-20 w-20 rounded-2xl border border-grape-400/40" />
        <div className="absolute right-24 top-[45%] h-3 w-3 rounded-full bg-brand-400/60" />
        <div className="absolute right-8 bottom-40 h-2.5 w-2.5 rounded-full bg-sun-400/60" />
      </div>
    </div>
  );
}
