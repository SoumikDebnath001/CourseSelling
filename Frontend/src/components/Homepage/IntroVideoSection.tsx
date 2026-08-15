import { PlayCircle } from "lucide-react";

export default function IntroVideoSection({
  introVideo,
  heroVideo,
}: {
  introVideo?: string;
  heroVideo?: string;
}) {
  return (
    <section className="relative z-20 -mt-[100vh] min-h-screen flex flex-col justify-center w-full bg-[url('/homepage/HomeHero2.png')] bg-fixed bg-cover bg-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      {/* Full width frosted glass overlay for parallax */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="reveal relative mx-auto max-w-5xl px-4 py-12 lg:py-16">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-300 shadow-sm backdrop-blur-md border border-amber-400/30">
            <PlayCircle className="h-4 w-4" />
            Watch the intro
          </span>

          <h2 className="mt-4 text-3xl font-extrabold text-amber-500 drop-shadow-sm sm:text-4xl">
            See the academy in action
          </h2>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-teal-300/50 to-amber-400/40 blur-2xl" />

          <div className="aspect-video overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-teal-100 to-amber-400/15 shadow-2xl">
            {introVideo ? (
              <video
                className="h-full w-full bg-black object-contain"
                src={introVideo}
                controls
                playsInline
                poster="/brand/logo.png"
              />
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
                <PlayCircle className="h-16 w-16 text-teal-500/70 sm:h-20 sm:w-20" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
