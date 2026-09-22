"use client";

import React, { memo, useEffect, useRef } from "react";
type SlideType = { type: "image"; src: string } | { type: "icon"; icon: React.ReactNode; bg: string };
type Position = "left" | "center" | "right";

const panelSlides: Record<Position, SlideType>[] = [
    {
        left: { type: "icon", icon: (
            <div className="relative h-full w-full">
                <img loading="lazy" decoding="async" src="/homepage/HomeHero1.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-3xl md:text-6xl font-black text-white uppercase tracking-widest drop-shadow-lg max-md:[writing-mode:vertical-rl] max-md:[text-orientation:upright]">Educate</span>
                </div>
            </div>
        ), bg: "" },
        center: { type: "icon", icon: (
            <div className="relative h-full w-full">
                <img loading="lazy" decoding="async" src="/homepage/HomeHero2.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-3xl md:text-6xl font-black text-white uppercase tracking-widest drop-shadow-lg max-md:[writing-mode:vertical-rl] max-md:[text-orientation:upright]">Empower</span>
                </div>
            </div>
        ), bg: "" },
        right: { type: "icon", icon: (
            <div className="relative h-full w-full">
                <img loading="lazy" decoding="async" src="/homepage/Paralleximage.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-3xl md:text-6xl font-black text-white uppercase tracking-widest drop-shadow-lg max-md:[writing-mode:vertical-rl] max-md:[text-orientation:upright]">Elevate</span>
                </div>
            </div>
        ), bg: "" },
    },
    {
        left: { type: "icon", icon: (
            <div className="flex h-full w-full items-center justify-center p-4">
                <img loading="lazy" decoding="async" src="/homepage/FirstSlide.webp" alt="First Slide" className="h-[90%] w-full object-contain drop-shadow-2xl" />
            </div>
        ), bg: "bg-white/20 backdrop-blur-md border border-white/20" },
        center: { type: "icon", icon: (
            <div className="flex h-full w-full items-center justify-center p-4">
                <img loading="lazy" decoding="async" src="/homepage/MIddleSlide.webp" alt="Middle Slide" className="h-[90%] w-full object-contain drop-shadow-2xl" />
            </div>
        ), bg: "bg-white/20 backdrop-blur-md border border-white/20" },
        right: { type: "icon", icon: (
            <div className="flex h-full w-full items-center justify-center p-4">
                <img loading="lazy" decoding="async" src="/homepage/lastSlide.webp" alt="Last Slide" className="h-[90%] w-full object-contain drop-shadow-2xl" />
            </div>
        ), bg: "bg-white/20 backdrop-blur-md border border-white/20" },
    },
    {
        left: { type: "image", src: "/homepage/Paralleximage.webp" },
        center: { type: "image", src: "/homepage/HomeHero1.webp" },
        right: { type: "image", src: "/homepage/HomeHero2.webp" },
    },
];

const clamp = (
    value: number,
    min: number,
    max: number
) => Math.min(Math.max(value, min), max);

/*
 * Reveal clips are driven by the --s1 / --s2 CSS variables (0 → 1) that the
 * scroll handler writes straight onto the section, so scrolling never
 * re-renders React — the browser only recomputes the clip-paths.
 */
const REVEAL_DOWN = (v: string) => `inset(0 0 calc(100% - var(${v}) * 100%) 0)`;
const REVEAL_UP = (v: string) => `inset(calc(100% - var(${v}) * 100%) 0 0 0)`;

const Panel = memo(function Panel({
    position,
}: {
    position: Position;
}) {
    const isCenter = position === "center";

    const slides = panelSlides.map(
        (slide) => slide[position]
    );

    const firstClip = isCenter ? REVEAL_DOWN("--s1") : REVEAL_UP("--s1");

    const secondClip = isCenter ? REVEAL_UP("--s2") : REVEAL_DOWN("--s2");

    let clipClass = "";
    if (position === "left") {
        clipClass = "[clip-path:polygon(0_0,100%_0,82%_100%,0_100%)]";
    } else if (position === "center") {
        clipClass = "[clip-path:polygon(18%_0,100%_0,82%_100%,0_100%)] -ml-[0.5px]";
    } else {
        clipClass = "[clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)] -ml-[0.5px]";
    }

    return (
        <div
            className={`relative h-full w-1/3 overflow-hidden ${clipClass}`}
        >
            {/* Base image */}
            {slides[0].type === "icon" ? (
                <div className={`absolute inset-0 flex h-full w-full flex-col items-center justify-center ${slides[0].bg}`}>
                    {slides[0].icon}
                </div>
            ) : (
                <img loading="lazy" decoding="async" src={slides[0].src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
            )}

            {/* Stage 1 */}
            {slides[1].type === "icon" ? (
                <div className={`absolute inset-0 flex h-full w-full flex-col items-center justify-center ${slides[1].bg}`} style={{ clipPath: firstClip, willChange: "clip-path" }}>
                    {slides[1].icon}
                </div>
            ) : (
                <img loading="lazy" decoding="async" src={slides[1].src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: firstClip, willChange: "clip-path" }} />
            )}

            {/* Stage 2 */}
            {slides[2].type === "icon" ? (
                <div className={`absolute inset-0 flex h-full w-full flex-col items-center justify-center ${slides[2].bg}`} style={{ clipPath: secondClip, willChange: "clip-path" }}>
                    {slides[2].icon}
                </div>
            ) : (
                <img loading="lazy" decoding="async" src={slides[2].src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: secondClip, willChange: "clip-path" }} />
            )}
        </div>
    );
});

function ThreeGirdDisplay() {
    const sectionRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        let frame = 0;
        let lastS1 = -1;
        let lastS2 = -1;

        const updateProgress = () => {
            frame = 0;

            const rect = section.getBoundingClientRect();

            /*
             * The section is taller than the viewport and its content is
             * sticky (100vh), so the animation scroll distance is
             * section height - viewport height.
             */
            const scrollDistance =
                section.offsetHeight - window.innerHeight;

            const progress =
                scrollDistance <= 0
                    ? 0
                    : clamp(-rect.top / scrollDistance, 0, 1);

            // Two equal stages: 0 → 0.5 and 0.5 → 1.
            const s1 = clamp(progress * 2, 0, 1);
            const s2 = clamp(progress * 2 - 1, 0, 1);

            if (s1 !== lastS1) {
                section.style.setProperty("--s1", String(s1));
                lastS1 = s1;
            }
            if (s2 !== lastS2) {
                section.style.setProperty("--s2", String(s2));
                lastS2 = s2;
            }
        };

        const handleScroll = () => {
            if (!frame) frame = requestAnimationFrame(updateProgress);
        };

        updateProgress();

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
        };
    }, []);

    return (
        <section
            ref={sectionRef}
            style={{ "--s1": 0, "--s2": 0 } as React.CSSProperties}
            className="
                relative
                h-[400vh]
                w-full
                bg-[#f4f1eb]
            "
        >
            {/* Sticky visual */}
            <div
                className="
                    sticky
                    top-0
                    flex
                    flex-col
                    h-screen
                    w-full
                    items-center
                    justify-center
                    overflow-hidden
                    px-3
                    sm:px-6
                    lg:px-10
                "
            >
                {/* Background Design Elements */}
                <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute -left-40 top-0 z-0 h-[60vh] w-[60vh] rounded-full bg-green-500/20 blur-[100px] pointer-events-none transform-gpu" />
                <div className="absolute -right-40 bottom-0 z-0 h-[60vh] w-[60vh] rounded-full bg-amber-500/20 blur-[100px] pointer-events-none transform-gpu" />
                <div className="absolute left-1/2 top-1/2 z-0 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none transform-gpu" />

                <div className="mb-6 z-10 text-center text-green-600 border-[4px] border-[#FFD700] px-8 py-3 rounded-2xl text-4xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-widest bg-white/40 backdrop-blur-xl shadow-2xl">
                    The Obuya Blueprint
                </div>
                <div
                    className="
                        relative
                        z-10
                        h-[60vh]
                        min-h-[360px]
                        max-h-[720px]
                        w-full
                        max-w-[1400px]
                        drop-shadow-2xl
                    "
                >
                    <div
                        className="
                            absolute
                            inset-0
                            flex
                        "
                    >
                        <Panel position="left" />

                        <Panel position="center" />

                        <Panel position="right" />
                    </div></div>
            </div>
        </section>
    );
}

export default memo(ThreeGirdDisplay);
