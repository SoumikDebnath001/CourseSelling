import dynamic from "next/dynamic";
import Image from "next/image";
import { HeartHandshake, ExternalLink, Globe, PlayCircle } from "lucide-react";

/** 3D orbital centrepiece — WebGL, so load it client-side only. */
const FoundationOrbit3D = dynamic(
  () => import("@/components/foundation/FoundationOrbit3D"),
  {
    ssr: false,
  }
);

export default function FoundationSection({
  foundationSite,
  foundationVideo,
  foundationImage,
  benefits,
  cta,
}: {
  foundationSite?: string;
  foundationVideo?: string;
  foundationImage?: string;
  benefits: Array<{
    text: string;
    icon: any;
    color: string;
    bg: string;
    ring: string;
  }>;
  cta: any;
}) {
  return (
    <section className="reveal mx-auto w-full px-2 py-10 sm:px-4 lg:py-14">
      <div className="relative mx-auto w-full max-w-[1800px] overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal-50 via-white to-amber-400/10 p-6 shadow-2xl ring-1 ring-ink-100 sm:p-12 lg:p-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-16 -left-16 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />

        <div className="relative flex flex-col items-center gap-16 lg:gap-24">
          {/* Top */}
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700 shadow-sm">
              <HeartHandshake className="h-4 w-4" />
              Our Foundation
            </span>

            <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              More than an academy
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
              Beyond online coaching, our foundation brings cricket to
              children who can&apos;t afford it. Every learner here helps put
              a bat in another kid&apos;s hands — explore our work and join
              in.
            </p>
          </div>

          {/* 3D Orbit */}
          <div className="flex w-full flex-col items-center gap-8 py-2 lg:gap-12 lg:py-6">
            <FoundationOrbit3D className="h-80 w-full max-w-2xl sm:h-[30rem]" />

            <div className="flex max-w-3xl flex-wrap items-center justify-center gap-3 sm:gap-4">
              {benefits.map((b) => (
                <div
                  key={b.text}
                  className={`flex items-center gap-2.5 rounded-full border border-white/80 bg-white/80 px-4 py-2.5 shadow-md backdrop-blur-md ring-1 ${b.ring}`}
                >
                  <span
                    className={`rounded-xl p-1.5 ${b.bg} ring-1 ring-black/5`}
                  >
                    <b.icon
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${b.color}`}
                    />
                  </span>

                  <span className="whitespace-nowrap text-sm font-extrabold tracking-wide text-ink-800 sm:text-base">
                    {b.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Foundation image + links */}
          <div className="mt-4 grid w-full max-w-5xl items-center gap-10 md:grid-cols-2 lg:mt-8">
            <div className="overflow-hidden rounded-3xl bg-ink-100 shadow-xl ring-1 ring-ink-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="relative aspect-[16/10] w-full">
                {foundationImage ? (
                  <Image
                    src={foundationImage}
                    alt="Our foundation"
                    width={640}
                    height={400}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-ink-50 text-ink-400">
                    <Image
                      src="/brand/logo.png"
                      alt=""
                      width={60}
                      height={60}
                      className="h-12 w-12 opacity-30 grayscale"
                    />

                    <span className="text-sm font-medium">
                      Foundation image
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center gap-5 px-4 md:px-0">
              <h3 className="text-2xl font-bold text-ink-900">
                Make an Impact
              </h3>

              <p className="text-base leading-relaxed text-ink-600">
                See how we are changing lives through cricket. Visit our
                foundation website or watch our documentary to learn more
                about our ongoing initiatives.
              </p>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                {foundationSite ? (
                  <a
                    href={foundationSite}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...cta}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-teal-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-amber-600/20 transition-all duration-300 hover:scale-105 hover:shadow-xl sm:w-auto"
                  >
                    <Globe className="h-4 w-4" />
                    Visit Foundation
                    <ExternalLink data-arrow className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="text-sm font-medium text-ink-400">
                    Foundation website coming soon.
                  </span>
                )}

                {foundationVideo && (
                  <a
                    href={foundationVideo}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...cta}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-8 py-3.5 font-semibold text-ink-700 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-ink-50 hover:shadow-md sm:w-auto"
                  >
                    <PlayCircle className="h-5 w-5 text-amber-600" />
                    Watch Video
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
