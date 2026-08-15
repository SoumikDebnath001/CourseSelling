import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowUpRight,
  FiStar,
  FiMapPin,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";

import HeroSlideBackground from "../Components/UI/HomePageUI/HeroSlideBackground";
import GridImageChnager from "../Components/UI/HomePageUI/GridImageChnager";
import WindowImageGlalary from "../Components/UI/HomePageUI/WindowImageGlalary";
import ThreeGirdDisplay from "../Components/UI/HomePageUI/ThreeGirdDisplay";
import TestimonialUi from "../Components/UI/HomePageUI/TestimonialUi";
import Enjoy from "../assets/Homepage/Enjoy.svg";

/* =========================================================
   STATS DATA
========================================================= */

const stats = [
  {
    number: "200+",
    label: "Luxury Rooms",
    icon: FiCalendar,
  },
  {
    number: "50+",
    label: "Destinations",
    icon: FiMapPin,
  },
  {
    number: "98%",
    label: "Guest Satisfaction",
    icon: FiStar,
  },
  {
    number: "24/7",
    label: "Concierge Service",
    icon: FiUsers,
  },
];

/* =========================================================
   HOME PAGE
========================================================= */

const HomePage = () => {
  const navigate = useNavigate();

  const ctaRef = useRef(null);

  const [ctaProgress, setCtaProgress] = useState(0);

  /* =======================================================
     CTA PARALLAX
  ======================================================= */

  useEffect(() => {
    let ticking = false;

    const updateParallax = () => {
      if (!ctaRef.current) {
        ticking = false;
        return;
      }

      const rect =
        ctaRef.current.getBoundingClientRect();

      const viewportHeight =
        window.innerHeight;

      const progress =
        (viewportHeight - rect.top) /
        (viewportHeight + rect.height);

      setCtaProgress(
        Math.min(
          Math.max(progress, 0),
          1
        )
      );

      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      requestAnimationFrame(
        updateParallax
      );
    };

    updateParallax();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
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

  /* =======================================================
     PARALLAX VALUES
  ======================================================= */

  const backgroundY =
    (ctaProgress - 0.5) * -100;

  const contentY =
    (ctaProgress - 0.5) * 45;

  return (
    <div
      className="
        min-h-screen
        bg-[#0c0a09]
        text-white
      "
    >
      <main>

        {/* =================================================
            HERO
        ================================================= */}

        <HeroSlideBackground />

        {/* =================================================
            BOOKING BAR
        ================================================= */}

        <section
          className="
            relative
            z-10
            -mt-20
            px-4
            sm:px-8
            lg:px-16
          "
        >

          <div className="mx-auto max-w-5xl">
            <img
  src={Enjoy}
  alt="Enjoy your stay"
  className="mx-auto mb-8 w-full max-w-2xl"
/>
            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-stone-900/80
                px-6
                py-6
                shadow-2xl
                backdrop-blur-xl
                sm:px-10
                sm:py-8
              "
            >
 
              <div
                className="
                  flex
                  flex-col
                  items-center
                  justify-between
                  gap-6
                  md:flex-row
                "
              >
                   
                <div>

                  <p
                    className="
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-[0.2em]
                      text-amber-400
                    "
                  >
                    Plan your stay
                  </p>

                  <h2
                    className="
                      mt-2
                      font-serif
                      text-2xl
                      font-medium
                      tracking-tight
                      text-white
                      sm:text-3xl
                    "
                  >
                    Find your perfect escape
                  </h2>

                  <p
                    className="
                      mt-2
                      max-w-md
                      text-sm
                      leading-6
                      text-stone-400
                    "
                  >
                    Browse our handpicked collection
                    of luxury rooms and suites. From
                    oceanfront retreats to urban
                    sanctuaries.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/services")
                  }
                  className="
                    group
                    inline-flex
                    shrink-0
                    cursor-pointer
                    items-center
                    gap-3
                    rounded-xl
                    bg-gradient-to-r
                    from-amber-500
                    to-amber-600
                    px-8
                    py-4
                    text-sm
                    font-semibold
                    text-white
                    shadow-[0_0_20px_rgba(245,158,11,0.25)]
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:from-amber-400
                    hover:to-amber-500
                    hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]
                  "
                >
                  Explore Rooms

                  <FiArrowUpRight
                    className="
                      h-4
                      w-4
                      transition-transform
                      duration-300
                      group-hover:translate-x-0.5
                      group-hover:-translate-y-0.5
                    "
                  />

                </button>

              </div>

            </div>

          </div>
        </section>

        {/* =================================================
            SECTION 2
        ================================================= */}

        <GridImageChnager />

        {/* =================================================
            STATS
        ================================================= */}

        <section
          className="
            relative
            overflow-hidden
            bg-stone-950
            py-16
            lg:py-20
          "
        >

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-b
              from-stone-950
              via-stone-900/50
              to-stone-950
            "
          />

          <div
            className="
              relative
              mx-auto
              max-w-7xl
              px-6
              sm:px-10
              lg:px-16
            "
          >

            <div
              className="
                grid
                grid-cols-2
                gap-6
                sm:gap-8
                lg:grid-cols-4
                lg:gap-12
              "
            >

              {stats.map(
                ({
                  number,
                  label,
                  icon: Icon,
                }) => (

                  <div
                    key={label}
                    className="
                      group
                      text-center
                    "
                  >

                    <div
                      className="
                        mx-auto
                        mb-4
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-amber-500/20
                        bg-amber-500/10
                        text-amber-400
                        transition-all
                        duration-300
                        group-hover:border-amber-500/40
                        group-hover:bg-amber-500/20
                      "
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <p
                      className="
                        font-serif
                        text-3xl
                        font-bold
                        text-white
                        sm:text-4xl
                      "
                    >
                      {number}
                    </p>

                    <p
                      className="
                        mt-1.5
                        text-xs
                        font-medium
                        uppercase
                        tracking-[0.15em]
                        text-stone-500
                      "
                    >
                      {label}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        </section>

        {/* =================================================
            WINDOW GALLERY
        ================================================= */}

        <WindowImageGlalary />

        {/* =================================================
            TESTIMONIALS
        ================================================= */}

        <TestimonialUi />

        {/* =================================================
            THREE GRID DISPLAY
        ================================================= */}

        <ThreeGirdDisplay />

        {/* =================================================
            FINAL PARALLAX CTA
        ================================================= */}

        <section
          ref={ctaRef}
          className="
            relative
            isolate
            min-h-[620px]
            overflow-hidden
            bg-stone-950
            sm:min-h-[680px]
            lg:min-h-[760px]
          "
        >

          {/* =================================================
              BACKGROUND IMAGE
          ================================================= */}

          <div
            className="
              absolute
              inset-0
              -z-20
              overflow-hidden
            "
          >

            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2200&q=90"
              alt=""
              className="
                absolute
                inset-0
                h-[120%]
                w-full
                object-cover
                opacity-65
                will-change-transform
              "
              style={{
                transform: `
                  translate3d(
                    0,
                    ${backgroundY}px,
                    0
                  )
                  scale(1.08)
                `,
              }}
            />

            {/* Very light dark overlay */}

            <div
              className="
                absolute
                inset-0
                bg-black/25
              "
            />

            {/* Bottom gradient */}

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-stone-950/75
                via-transparent
                to-black/10
              "
            />

          </div>

          {/* =================================================
              AMBIENT GLOW
          ================================================= */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              -z-10
              h-[500px]
              w-[500px]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-amber-500/[0.07]
              blur-[150px]
            "
          />

          {/* =================================================
              CONTENT
          ================================================= */}

          <div
            className="
              relative
              flex
              min-h-[620px]
              items-center
              justify-center
              px-5
              py-20
              sm:min-h-[680px]
              sm:px-8
              lg:min-h-[760px]
            "
          >

            <div
              className="
                w-full
                max-w-4xl
                will-change-transform
              "
              style={{
                transform: `
                  translate3d(
                    0,
                    ${contentY}px,
                    0
                  )
                `,
              }}
            >

              {/* =================================================
                  TRANSPARENT GLASS PANEL
              ================================================= */}

              <div
                className="
                  relative
                  overflow-hidden
                  rounded-[30px]
                  border
                  border-white/[0.10]
                  bg-white/[0.035]
                  px-6
                  py-12
                  text-center
                  shadow-[0_30px_100px_rgba(0,0,0,0.25)]
                  backdrop-blur-xl
                  sm:px-10
                  sm:py-16
                  lg:px-16
                  lg:py-20
                "
              >

                {/* Glass top highlight */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-x-0
                    top-0
                    h-px
                    bg-gradient-to-r
                    from-transparent
                    via-white/20
                    to-transparent
                  "
                />

                {/* Very subtle glass glow */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    left-1/2
                    top-0
                    h-32
                    w-64
                    -translate-x-1/2
                    rounded-full
                    bg-amber-400/[0.045]
                    blur-[70px]
                  "
                />

                {/* =================================================
                    TEXT
                ================================================= */}

                <div
                  className="
                    relative
                    z-10
                  "
                >

                  <p
                    className="
                      mb-5
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.25em]
                      text-amber-400
                      sm:text-[11px]
                    "
                  >
                    Your journey awaits
                  </p>

                  <h2
                    className="
                      font-serif
                      text-4xl
                      leading-[1.05]
                      tracking-[-0.035em]
                      text-white
                      sm:text-5xl
                      lg:text-7xl
                    "
                  >
                    Make yourself at home,
                    <br />

                    <span
                      className="
                        italic
                        text-white/65
                      "
                    >
                      wherever you go.
                    </span>
                  </h2>

                  <p
                    className="
                      mx-auto
                      mt-6
                      max-w-xl
                      text-sm
                      leading-7
                      text-white/60
                      sm:text-base
                    "
                  >
                    From serene beachfront villas to
                    vibrant city retreats, ComfyStay
                    brings you handpicked luxury
                    experiences that feel like coming
                    home.
                  </p>

                  {/* =================================================
                      BUTTONS
                  ================================================= */}

                  <div
                    className="
                      mt-9
                      flex
                      flex-col
                      items-center
                      justify-center
                      gap-3
                      sm:flex-row
                      sm:gap-4
                    "
                  >

                    <button
                      type="button"
                      onClick={() =>
                        navigate("/services")
                      }
                      className="
                        group
                        inline-flex
                        cursor-pointer
                        items-center
                        gap-3
                        rounded-xl
                        bg-gradient-to-r
                        from-amber-500
                        to-amber-600
                        px-7
                        py-3.5
                        text-sm
                        font-semibold
                        text-white
                        shadow-[0_0_25px_rgba(245,158,11,0.25)]
                        transition-all
                        duration-300
                        hover:-translate-y-0.5
                        hover:from-amber-400
                        hover:to-amber-500
                        hover:shadow-[0_0_35px_rgba(245,158,11,0.4)]
                      "
                    >
                      Browse Our Rooms

                      <FiArrowUpRight
                        className="
                          h-4
                          w-4
                          transition-transform
                          duration-300
                          group-hover:translate-x-0.5
                          group-hover:-translate-y-0.5
                        "
                      />
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>
    </div>
  );
};

export default HomePage;