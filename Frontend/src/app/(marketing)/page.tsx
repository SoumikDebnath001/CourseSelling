"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Check, Quote, PlayCircle, Youtube, HeartHandshake, ExternalLink } from "lucide-react";
import { useCatalog } from "@/hooks/useCourses";
import { useSettings, youtubeEmbedUrl } from "@/hooks/useSettings";
import { CourseCard } from "@/components/course/CourseCard";
import { useAuth } from "@/store/auth";

gsap.registerPlugin(ScrollTrigger, useGSAP);

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
  const hero = settings.hero ?? {};
  const heroVideo = youtubeEmbedUrl(hero.videoUrl);
  const foundationSite = settings.foundation?.websiteUrl;
  const foundationVideo = settings.foundation?.youtubeUrl;

  useGSAP(
    () => {
      // Hero entrance — staggered reveal of the headline column.
      gsap.from(".hero-anim", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
      });

      // The ball pops in, then its surrounding elements begin orbiting forever.
      gsap.from(".hero-ball", { scale: 0, opacity: 0, duration: 0.9, ease: "back.out(1.6)", delay: 0.2 });
      gsap.to(".orbit", { rotation: 360, repeat: -1, duration: 22, ease: "none" });
      // Counter-rotate each satellite so the shapes stay upright while revolving.
      gsap.to(".satellite", { rotation: -360, repeat: -1, duration: 22, ease: "none" });

      // Scroll-triggered reveals for every section block.
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative">
      {/* ───────── Page background (academy icon, very faint) ───────── */}
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

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <span className="hero-anim inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {hero.badge || "🏏 Online Cricket Academy"}
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
            <p className="hero-anim mt-4 max-w-md text-ink-500">
              {hero.subtitle ||
                "Learn batting, bowling and match craft at your own pace — HD video lessons, module tests and direct coach feedback, anytime you want."}
            </p>

            <div className="hero-anim mt-6 flex flex-wrap gap-3">
              <Link href="/catalog" {...cta} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-grape-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-600/20">
                Get started <ArrowRight data-arrow className="h-4 w-4" />
              </Link>
              <Link href="/about" {...cta} className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-6 py-3 font-semibold text-ink-700">
                Learn more
              </Link>
            </div>

            <div className="hero-anim mt-10 flex gap-8">
              {[
                { n: "3000+", l: "Students" },
                { n: "10+", l: "Years coaching" },
                { n: "25+", l: "Pro mentors" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="text-2xl font-extrabold text-ink-900">{s.n}</p>
                  <p className="text-xs text-ink-400">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual: a ball with elements orbiting around it. */}
          <div className="relative mx-auto hidden h-80 w-80 lg:block">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-grape-500" />

            {/* Orbiting layer — rotates forever; each satellite counter-rotates. */}
            <div className="orbit absolute inset-0">
              <div className="satellite absolute -right-4 top-6 h-20 w-20 rounded-full bg-sun-400" />
              <div className="satellite absolute -left-6 bottom-10 h-16 w-16 rounded-2xl bg-brand-300" />
              <div className="satellite absolute right-8 -bottom-4 h-12 w-12 rounded-full border-4 border-grape-400 bg-white" />
              <div className="satellite absolute left-10 -top-4 h-10 w-10 rounded-full bg-grape-300" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/brand/ball.png" alt="" width={150} height={150} className="hero-ball drop-shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Benefits + intro video ───────── */}
      <section className="reveal mx-auto max-w-6xl px-4 py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 to-grape-100">
              {heroVideo ? (
                <iframe
                  className="h-full w-full"
                  src={heroVideo}
                  title="Intro video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <PlayCircle className="h-20 w-20 text-brand-500/70" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 h-24 w-24 rounded-3xl bg-sun-300/70 blur-sm" />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-extrabold text-ink-900">Benefits of online learning</h2>
            <p className="mt-2 text-ink-500">Everything you need to improve, in one place.</p>
            <ul className="mt-6 space-y-3">
              {[
                "Learn at your own pace, anytime",
                "Better time management with self-paced drills",
                "Direct feedback from academy coaches",
                "Track your progress as you complete topics",
                "Build match-ready technical skills",
              ].map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-ink-700">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── Choose your classes ───────── */}
      {featured.length > 0 && (
        <section className="reveal mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-ink-900">Choose your classes</h2>
              <p className="mt-2 text-ink-500">Popular courses picked for you.</p>
            </div>
            <Link href="/catalog" className="flex items-center gap-1 text-sm font-semibold text-brand-700">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <CourseCard key={c._id} course={c} />)}
          </div>
        </section>
      )}

      {/* ───────── Contribute to our foundation ───────── */}
      <section className="reveal mx-auto max-w-6xl px-4 py-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-grape-600 to-brand-700 px-8 py-12 text-white sm:px-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 left-10 h-52 w-52 rounded-full bg-sun-400/10" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <HeartHandshake className="h-4 w-4" /> Give back
              </span>
              <h2 className="mt-4 text-3xl font-extrabold">Contribute to our Foundation</h2>
              <p className="mt-3 max-w-md text-brand-100">
                Beyond the academy, our foundation brings cricket to children who can&apos;t afford coaching.
                Every contribution helps put a bat in another kid&apos;s hands — explore our work and join in.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {foundationSite && (
                  <a href={foundationSite} target="_blank" rel="noopener noreferrer" {...cta} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-grape-700">
                    Visit the Foundation <ExternalLink data-arrow className="h-4 w-4" />
                  </a>
                )}
                {foundationVideo && (
                  <a href={foundationVideo} target="_blank" rel="noopener noreferrer" {...cta} className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 font-semibold text-white">
                    <Youtube className="h-4 w-4" /> Watch on YouTube
                  </a>
                )}
                {!foundationSite && !foundationVideo && (
                  <span className="text-sm text-brand-100/80">Foundation links coming soon.</span>
                )}
              </div>
            </div>
            <div className="hidden justify-center lg:flex">
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white/10 ring-8 ring-white/5">
                <HeartHandshake className="h-20 w-20 text-white/90" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Testimonial ───────── */}
      <section className="reveal mx-auto max-w-4xl px-4 py-14">
        <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-card sm:p-12">
          <Quote className="h-10 w-10 text-grape-300" />
          <p className="mt-4 text-xl font-medium text-ink-800">
            “The video lessons feel like a coach is right there with me. The module tests keep me
            honest, and I can ask questions under each video. My batting has genuinely improved.”
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">A</div>
            <div>
              <p className="font-semibold text-ink-900">Alexander</p>
              <p className="text-sm text-ink-400">Academy student</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Join CTA (hidden once signed in) ───────── */}
      {!account && (
        <section className="reveal mx-auto max-w-6xl px-4 pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-grape-600 px-8 py-12 text-center sm:px-16">
            <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-10 right-10 h-40 w-40 rounded-full bg-sun-400/20" />
            <h2 className="relative text-3xl font-extrabold text-white">Let&apos;s join the academy</h2>
            <p className="relative mx-auto mt-2 max-w-md text-brand-100">
              Create your free account and start learning cricket the right way today.
            </p>
            <Link href="/login" {...cta} className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-brand-700">
              Get started <ArrowRight data-arrow className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
