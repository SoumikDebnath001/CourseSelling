import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Counter from "@/components/ui/Counter";
import { useAppLoaded } from "@/lib/appLoader";

/** Digit places for a whole number, e.g. 3000 → [1000, 100, 10, 1]. */
const placesOf = (n: number) =>
  Array.from({ length: String(n).length }, (_, i) => 10 ** (String(n).length - 1 - i));

function HeroSection({ hero, cta }: { hero: any; cta: any }) {
  // Hold the count-up at 0 until the page loader is gone so it's visible.
  const appLoaded = useAppLoaded();

  return (
    <section
      className="
    relative
    isolate
    min-h-[100vh]
    lg:h-[100vh]
    overflow-hidden
  "
    >
      {/* ───────── Background photo (optimised + preloaded as the LCP image) ───────── */}
      <Image
        src="/homepage/HomeHero2.png"
        alt=""
        fill
        priority
        sizes="100vw"
        quality={80}
        className="-z-10 object-cover object-center"
      />

      {/* ───────── Dark readability overlay ───────── */}
      <div
        className="
      pointer-events-none
      absolute
      inset-0
      bg-gradient-to-r
      from-black/55
      via-black/20
      to-transparent
    "
      />

      <div
        className="
      mx-auto
      grid
      h-full
      max-w-6xl
      items-center
      gap-8
      px-4
      pt-24
      pb-8

      lg:grid-cols-[0.85fr_1.15fr]
      lg:gap-2
      lg:px-8
      lg:py-0

      xl:max-w-7xl
      xl:grid-cols-[0.8fr_1.2fr]
      xl:gap-0
    "
      >

        {/* ───────── Hero Text ───────── */}
        <div
          className="
        hero-anim
        order-2
        text-center
        lg:order-1
        lg:max-w-xl
        lg:text-left
      "
        >
          {/* Badge */}
          <span
            className="
          hero-anim
          inline-flex
          items-center
          gap-2
          rounded-full
          border
          border-white/30
          bg-white/90
          px-3
          py-1
          text-xs
          font-bold
          text-teal-700
          shadow-lg
          backdrop-blur-md
        "
          >
            {hero.badge || "🏏 Obuya Grassroots E-Learning"}
          </span>

          {/* Heading */}
          <h1
            className="
          hero-anim
          mt-4
          text-2xl
          font-extrabold
          leading-tight
          tracking-tight
          text-white
          drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)]
          sm:text-5xl

          lg:text-6xl
          lg:leading-[1.05]

          xl:text-7xl
        "
          >
            {hero.title || (
              <>
                <span
                  className="
                rounded-lg
                bg-white
                px-2
                text-ink-900
                shadow-lg
              "
                >
                  Train
                </span>{" "}
                at Home with the{" "}
                <span
                  className="
                rounded-lg
                bg-amber-500
                px-2
                text-white
                shadow-lg
              "
                >
                  Best
                </span>{" "}
                Coaches
              </>
            )}

            {hero.title && hero.highlight && (
              <>
                {" "}
                <span
                  className="
                rounded-lg
                bg-amber-500
                px-2
                text-white
                shadow-lg
              "
                >
                  {hero.highlight}
                </span>
              </>
            )}
          </h1>

          {/* Description */}
          <p
            className="
          hero-anim
          mx-auto
          mt-3
          max-w-md
          text-[10px]
          font-medium
          leading-relaxed
          text-white/90
          drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]
          sm:mt-4
          sm:text-base

          lg:mx-0
          lg:mt-5
          lg:max-w-lg
          lg:text-base

          xl:text-lg
        "
          >
            {hero.subtitle ||
              "Learn batting, bowling and match craft at your own pace — HD video lessons, module tests and direct coach feedback, anytime you want."}
          </p>

          {/* CTA */}
          <div
            className="
          hero-anim
          mt-6
          flex
          flex-col
          flex-wrap
          justify-center
          gap-3
          sm:flex-row

          lg:justify-start
          lg:mt-7
        "
          >
            <Link
              href="/catalog"
              {...cta}
              className="
            inline-flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-full
            bg-gradient-to-r
            from-teal-500
            to-amber-500
            px-6
            py-3
            font-bold
            text-white
            shadow-xl
            shadow-black/30
            transition-all

            sm:w-auto
            lg:px-7
            lg:py-3.5
          "
            >
              Get started
              <ArrowRight data-arrow className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats */}
          <div
            className="
          hero-anim
          mt-8
          flex
          w-full
          flex-row
          items-center
          justify-between
          px-2
          gap-2

          sm:mt-10
          sm:justify-center
          sm:gap-12
          sm:px-0

          lg:mt-9
          lg:justify-start
          lg:gap-10

          xl:gap-14
        "
          >
            {[
              {
                value: 3000,
                suffix: "+",
                l: "Students",
              },
              {
                value: 10,
                suffix: "+",
                l: "Years coaching",
              },
              {
                value: 25,
                suffix: "+",
                l: "Pro mentors",
              },
            ].map((s) => (
              <div
                key={s.l}
                className="
              flex
              min-w-0
              flex-col
              items-center
              gap-1
              sm:items-start
            "
              >
                  <div
                    className="
                flex
                items-center
                text-xl
                font-extrabold
                text-white
                drop-shadow-[0_3px_8px_rgba(0,0,0,0.7)]
                sm:text-3xl
              "
                  >
                  <Counter
                    value={appLoaded ? s.value : 0}
                    places={placesOf(s.value)}
                    fontSize={30}
                    padding={0}
                    gap={1}
                    horizontalPadding={0}
                    textColor="inherit"
                    fontWeight="inherit"
                    gradientHeight={0}
                  />

                  <span>{s.suffix}</span>
                </div>

                <p
                  className="
                text-[10px]
                sm:text-xs
                font-semibold
                uppercase
                tracking-wider
                text-white/80
                drop-shadow-[0_2px_5px_rgba(0,0,0,0.7)]
              "
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ───────── Hero Circle / Animation ───────── */}
        <div
          className="
        hero-ball
        order-1
        relative
        mx-auto
        h-52
        w-52

        sm:h-80
        sm:w-80

        lg:order-2
        lg:mt-0
        lg:h-[32rem]
        lg:w-[32rem]

        xl:h-[36rem]
        xl:w-[36rem]
      "
        >
          {/* Static glow */}
          <div
            className="
          absolute
          -inset-8
          rounded-full
          bg-teal-400/20
          blur-3xl
        "
          />

          {/* STATIC CRICKETER */}
          <div
            className="
          absolute
          inset-[13%]
          z-10
          flex
          items-center
          justify-center
        "
          >
            <Image
              src="/homepage/cricketer.png"
              alt="Cricketer"
              width={320}
              height={320}
              priority
              className="
            h-[110px]
            w-auto
            object-contain
            drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]

            sm:h-[200px]

            lg:h-[280px]

            xl:h-[320px]
          "
            />
          </div>

          {/* STATIC HOLLOW RING */}
          <Image
            src="/brand/Hollowring.png"
            alt="Obuya Grassroots Foundation"
            width={800}
            height={800}
            priority
            className="
          absolute
          inset-0
          z-20
          h-full
          w-full
          object-contain
          drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]
        "
          />

          {/* ONLY SURROUNDING ELEMENTS ANIMATE */}
          <div className="orbit absolute inset-0 z-30 animate-[spin_22s_linear_infinite]">

            {/* Cricket ball */}
            <div
              className="
            satellite
            animate-[spin_22s_linear_infinite_reverse]
            absolute
            -right-4
            top-6
            h-12
            w-12

            sm:-right-3
            sm:top-10
            sm:h-16
            sm:w-16

            lg:-right-4
            lg:top-[10%]
            lg:h-[4.5rem]
            lg:w-[4.5rem]

            xl:-right-5
            xl:h-20
            xl:w-20
          "
            >
              <Image
                src="/brand/ball.png"
                alt=""
                width={64}
                height={64}
                className="
              h-full
              w-full
              object-contain
              drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]
            "
              />
            </div>

            {/* Teal satellite */}
            <div
              className="
            satellite
            animate-[spin_22s_linear_infinite_reverse]
            absolute
            -left-5
            bottom-12
            h-10
            w-10
            rounded-2xl
            border
            border-white/40
            bg-teal-300/90
            shadow-[0_10px_30px_rgba(20,184,166,0.5)]
            backdrop-blur-md

            sm:-left-5
            sm:bottom-14
            sm:h-14
            sm:w-14

            lg:-left-4
            lg:bottom-[15%]
            lg:h-16
            lg:w-16

            xl:-left-5
            xl:h-[4.5rem]
            xl:w-[4.5rem]
          "
            />

            {/* Glass satellite */}
            <div
              className="
            satellite
            animate-[spin_22s_linear_infinite_reverse]
            absolute
            -bottom-3
            right-10
            h-9
            w-9
            rounded-full
            border-4
            border-amber-400
            bg-white/90
            shadow-xl
            backdrop-blur-md

            sm:right-12
            sm:h-12
            sm:w-12

            lg:right-[16%]
            lg:bottom-[4%]
            lg:h-14
            lg:w-14

            xl:h-16
            xl:w-16
          "
            />

            {/* Yellow satellite */}
            <div
              className="
            satellite
            animate-[spin_22s_linear_infinite_reverse]
            absolute
            left-12
            -top-2
            h-6
            w-6
            rounded-full
            bg-amber-300
            shadow-xl

            sm:left-14
            sm:top-0
            sm:h-9
            sm:w-9

            lg:left-[16%]
            lg:top-[4%]
            lg:h-10
            lg:w-10

            xl:h-12
            xl:w-12
          "
            />
          </div>

          {/* Static dots */}
          <div
            className="
          absolute
          right-[15%]
          top-[8%]
          z-30
          h-2
          w-2
          rounded-full
          bg-white
        "
          />

          <div
            className="
          absolute
          bottom-[12%]
          left-[18%]
          z-30
          h-2
          w-2
          rounded-full
          bg-amber-300
        "
          />
        </div>
      </div>
    </section>
  );
}

export default memo(HeroSection);
