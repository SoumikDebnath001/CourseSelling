"use client";

import React, { useEffect, useRef, useState } from "react";
type SlideType = { type: "image"; src: string } | { type: "icon"; icon: React.ReactNode; bg: string };
type Position = "left" | "center" | "right";

const panelSlides: Record<Position, SlideType>[] = [
    {
        left: { type: "icon", icon: (
            <div className="relative h-full w-full">
                <img src="/homepage/HomeHero1.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-3xl md:text-6xl font-black text-white uppercase tracking-widest drop-shadow-lg max-md:[writing-mode:vertical-rl] max-md:[text-orientation:upright]">Educate</span>
                </div>
            </div>
        ), bg: "" },
        center: { type: "icon", icon: (
            <div className="relative h-full w-full">
                <img src="/homepage/HomeHero2.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-3xl md:text-6xl font-black text-white uppercase tracking-widest drop-shadow-lg max-md:[writing-mode:vertical-rl] max-md:[text-orientation:upright]">Empower</span>
                </div>
            </div>
        ), bg: "" },
        right: { type: "icon", icon: (
            <div className="relative h-full w-full">
                <img src="/homepage/Paralleximage.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-3xl md:text-6xl font-black text-white uppercase tracking-widest drop-shadow-lg max-md:[writing-mode:vertical-rl] max-md:[text-orientation:upright]">Elevate</span>
                </div>
            </div>
        ), bg: "" },
    },
    {
        left: { type: "icon", icon: (
            <div className="flex h-full w-full items-center justify-center p-4">
                <img src="/homepage/FirstSlide.png" alt="First Slide" className="h-[90%] w-full object-contain drop-shadow-2xl" />
            </div>
        ), bg: "bg-white/20 backdrop-blur-md border border-white/20" },
        center: { type: "icon", icon: (
            <div className="flex h-full w-full items-center justify-center p-4">
                <img src="/homepage/MIddleSlide.png" alt="Middle Slide" className="h-[90%] w-full object-contain drop-shadow-2xl" />
            </div>
        ), bg: "bg-white/20 backdrop-blur-md border border-white/20" },
        right: { type: "icon", icon: (
            <div className="flex h-full w-full items-center justify-center p-4">
                <img src="/homepage/lastSlide.png" alt="Last Slide" className="h-[90%] w-full object-contain drop-shadow-2xl" />
            </div>
        ), bg: "bg-white/20 backdrop-blur-md border border-white/20" },
    },
    {
        left: { type: "image", src: "/homepage/Paralleximage.png" },
        center: { type: "image", src: "/homepage/HomeHero1.png" },
        right: { type: "image", src: "/homepage/HomeHero2.png" },
    },
];

const clamp = (
    value: number,
    min: number,
    max: number
) => Math.min(Math.max(value, min), max);

const rangeProgress = (
    progress: number,
    start: number,
    end: number
) => {
    if (end === start) return 0;

    return clamp(
        (progress - start) / (end - start),
        0,
        1
    );
};

function Panel({
    position,
    stage1,
    stage2,
}: {
    position: Position;
    stage1: number;
    stage2: number;
}) {
    const isCenter = position === "center";

    const slides = panelSlides.map(
        (slide) => slide[position]
    );

    const firstClip = isCenter
        ? `inset(0 0 ${100 - stage1 * 100}% 0)`
        : `inset(${100 - stage1 * 100}% 0 0 0)`;

    const secondClip = isCenter
        ? `inset(${100 - stage2 * 100}% 0 0 0)`
        : `inset(0 0 ${100 - stage2 * 100}% 0)`;

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
                <img src={slides[0].src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
            )}

            {/* Stage 1 */}
            {slides[1].type === "icon" ? (
                <div className={`absolute inset-0 flex h-full w-full flex-col items-center justify-center ${slides[1].bg}`} style={{ clipPath: firstClip, willChange: "clip-path" }}>
                    {slides[1].icon}
                </div>
            ) : (
                <img src={slides[1].src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: firstClip, willChange: "clip-path" }} />
            )}

            {/* Stage 2 */}
            {slides[2].type === "icon" ? (
                <div className={`absolute inset-0 flex h-full w-full flex-col items-center justify-center ${slides[2].bg}`} style={{ clipPath: secondClip, willChange: "clip-path" }}>
                    {slides[2].icon}
                </div>
            ) : (
                <img src={slides[2].src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: secondClip, willChange: "clip-path" }} />
            )}
        </div>
    );
}

export default function ThreeGirdDisplay() {
    const sectionRef = useRef<HTMLElement | null>(null);

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let ticking = false;

        const updateProgress = () => {
            const section = sectionRef.current;

            if (!section) {
                ticking = false;
                return;
            }

            const rect = section.getBoundingClientRect();

            /*
             * The section is 200vh.
             *
             * Sticky content occupies 100vh.
             *
             * Therefore the actual animation scroll distance
             * is:
             *
             * 200vh - 100vh = 100vh
             */

            const scrollDistance =
                section.offsetHeight - window.innerHeight;

            if (scrollDistance <= 0) {
                setProgress(0);
                ticking = false;
                return;
            }

            const currentProgress =
                -rect.top / scrollDistance;

            setProgress(
                clamp(currentProgress, 0, 1)
            );

            ticking = false;
        };

        const handleScroll = () => {
            if (ticking) return;

            ticking = true;

            requestAnimationFrame(
                updateProgress
            );
        };

        updateProgress();

        window.addEventListener(
            "scroll",
            handleScroll,
            { passive: true }
        );

        window.addEventListener(
            "resize",
            handleScroll
        );

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll
            );

            window.removeEventListener(
                "resize",
                handleScroll
            );
        };
    }, []);

    /*
     * Divide the animation into 3 equal stages.
     */

    const stage1 = rangeProgress(
        progress,
        0,
        0.5
    );

    const stage2 = rangeProgress(
        progress,
        0.5,
        1
    );

    return (
        <section
            ref={sectionRef}
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
                <div className="absolute -left-40 top-0 z-0 h-[60vh] w-[60vh] rounded-full bg-green-500/20 blur-[120px] pointer-events-none" />
                <div className="absolute -right-40 bottom-0 z-0 h-[60vh] w-[60vh] rounded-full bg-amber-500/20 blur-[120px] pointer-events-none" />
                <div className="absolute left-1/2 top-1/2 z-0 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />

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
                        <Panel
                            position="left"
                            stage1={stage1}
                            stage2={stage2}
                        />

                        <Panel
                            position="center"
                            stage1={stage1}
                            stage2={stage2}
                        />

                        <Panel
                            position="right"
                            stage1={stage1}
                            stage2={stage2}
                        />
                    </div></div>
            </div>
        </section>
    );
}