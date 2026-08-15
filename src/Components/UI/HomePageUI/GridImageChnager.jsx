import React, { useEffect, useRef, useState } from "react";

/* =========================================================
   HOTEL IMAGES
========================================================= */

const hotelImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1600&q=90",
];

/* =========================================================
   TILE COLORS
========================================================= */

const tileColors = [
  "#C9BBA8",
  "#7F9188",
  "#B48D73",
  "#7794A0",
  "#D0B89A",
  "#8E8175",
  "#A7B0A4",
];

/* =========================================================
   TILE DELAYS
========================================================= */

const diagonalDelays = Array.from({ length: 16 }, (_, index) => {
  const row = Math.floor(index / 4);
  const column = index % 4;

  return (row + column) * 85;
});

/* =========================================================
   COMPONENT
========================================================= */

const GridImageChnager = () => {
  const sectionRef = useRef(null);
  const hotelIndexRef = useRef(0);

  const [hotelIndex, setHotelIndex] = useState(0);
  const [tilePhase, setTilePhase] = useState("initial");

  const [transitionColorIndex, setTransitionColorIndex] =
    useState(0);

  const [parallax, setParallax] = useState(0);

  /* =========================================================
     PARALLAX
  ========================================================= */

  useEffect(() => {
    let ticking = false;

    const updateParallax = () => {
      if (!sectionRef.current) {
        ticking = false;
        return;
      }

      const rect =
        sectionRef.current.getBoundingClientRect();

      const sectionCenter =
        rect.top + rect.height / 2;

      const viewportCenter =
        window.innerHeight / 2;

      const distance =
        sectionCenter - viewportCenter;

      const value = Math.max(
        -1,
        Math.min(1, distance / window.innerHeight)
      );

      setParallax(value);

      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      requestAnimationFrame(updateParallax);
    };

    updateParallax();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  /* =========================================================
     IMAGE CHANGE ANIMATION
  ========================================================= */

  useEffect(() => {
    const timers = [];

    /* INITIAL REVEAL */

    const initialReveal = setTimeout(() => {
      setTilePhase("reveal");
    }, 200);

    const initialFinish = setTimeout(() => {
      setTilePhase("idle");
    }, 1700);

    timers.push(initialReveal, initialFinish);

    /* CHANGE HOTEL */

    const changeHotel = () => {
      const next =
        (hotelIndexRef.current + 1) %
        hotelImages.length;

      setTransitionColorIndex(
        next % tileColors.length
      );

      setTilePhase("cover");

      const switchImage = setTimeout(() => {
        hotelIndexRef.current = next;

        setHotelIndex(next);

        const reveal = setTimeout(() => {
          setTilePhase("reveal");
        }, 100);

        timers.push(reveal);
      }, 1320);

      const finish = setTimeout(() => {
        setTilePhase("idle");
      }, 2850);

      timers.push(switchImage, finish);
    };

    const interval = setInterval(
      changeHotel,
      5000
    );

    return () => {
      clearInterval(interval);

      timers.forEach((timer) =>
        clearTimeout(timer)
      );
    };
  }, []);

  /* =========================================================
     PARALLAX VALUES
  ========================================================= */

  const imageMove = parallax * 55;
  const textMove = parallax * -22;
  const innerImageMove = imageMove * -0.3;

  return (
    <>
      {/* =====================================================
          SECTION — COMPLETELY TRANSPARENT
      ===================================================== */}

      <section
        ref={sectionRef}
        className="
          relative
          flex
          min-h-screen
          w-full
          items-center
          overflow-hidden

          bg-transparent

          px-6
          py-24

          sm:px-10

          lg:px-16
          lg:py-32
        "
      >
        <div
          className="
            relative
            mx-auto

            grid
            w-full
            max-w-7xl

            items-center

            gap-16

            lg:grid-cols-2
            lg:gap-20
          "
        >
          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div
            className="
              max-w-xl
              will-change-transform
            "
            style={{
              transform: `translate3d(
                0,
                ${textMove}px,
                0
              )`,
            }}
          >
            {/* ===============================================
                ONLY TEXT BACKGROUND IS BLURRED
            =============================================== */}

            <div
              className="
                rounded-2xl

                border
                border-white/10

                bg-black/20

                p-7
                sm:p-9
                lg:p-10

                backdrop-blur-xl
                backdrop-saturate-150

                shadow-[0_20px_60px_rgba(0,0,0,0.12)]
              "
            >
              {/* EYEBROW */}

              <p
                className="
                  mb-5

                  text-xs
                  font-medium
                  uppercase
                  tracking-[0.35em]

                  text-white/70
                "
              >
                Why Choose Us
              </p>

              {/* TITLE */}

              <h2
                className="
                  font-serif

                  text-5xl
                  leading-[1.02]
                  tracking-tight

                  text-white

                  sm:text-6xl
                  lg:text-7xl
                "
              >
                Why We Are
                <br />

                <span
                  className="
                    italic
                    text-white/75
                  "
                >
                  The Best?
                </span>
              </h2>

              {/* DESCRIPTION */}

              <p
                className="
                  mt-8
                  max-w-lg

                  text-base
                  leading-8

                  text-white/75
                "
              >
                We make every stay more than just a
                booking. From carefully selected hotels
                to effortless reservations, we focus on
                comfort, quality and memorable
                experiences.
              </p>

              {/* =============================================
                  FEATURES
              ============================================= */}

              <div className="mt-10">

                {/* FEATURE 01 */}

                <div
                  className="
                    flex
                    gap-6

                    border-t
                    border-white/15

                    py-6
                  "
                >
                  <span
                    className="
                      pt-1
                      text-xs
                      text-white/45
                    "
                  >
                    01
                  </span>

                  <div>
                    <h3
                      className="
                        text-lg
                        font-medium
                        text-white
                      "
                    >
                      Handpicked Hotels
                    </h3>

                    <p
                      className="
                        mt-2
                        max-w-md

                        text-sm
                        leading-6

                        text-white/65
                      "
                    >
                      Every property is carefully
                      selected to maintain exceptional
                      standards of comfort, quality and
                      hospitality.
                    </p>
                  </div>
                </div>

                {/* FEATURE 02 */}

                <div
                  className="
                    flex
                    gap-6

                    border-t
                    border-white/15

                    py-6
                  "
                >
                  <span
                    className="
                      pt-1
                      text-xs
                      text-white/45
                    "
                  >
                    02
                  </span>

                  <div>
                    <h3
                      className="
                        text-lg
                        font-medium
                        text-white
                      "
                    >
                      Seamless Booking
                    </h3>

                    <p
                      className="
                        mt-2
                        max-w-md

                        text-sm
                        leading-6

                        text-white/65
                      "
                    >
                      Find your ideal room and complete
                      your reservation quickly with a
                      simple booking experience.
                    </p>
                  </div>
                </div>

                {/* FEATURE 03 */}

                <div
                  className="
                    flex
                    gap-6

                    border-y
                    border-white/15

                    py-6
                  "
                >
                  <span
                    className="
                      pt-1
                      text-xs
                      text-white/45
                    "
                  >
                    03
                  </span>

                  <div>
                    <h3
                      className="
                        text-lg
                        font-medium
                        text-white
                      "
                    >
                      Exceptional Experience
                    </h3>

                    <p
                      className="
                        mt-2
                        max-w-md

                        text-sm
                        leading-6

                        text-white/65
                      "
                    >
                      From arrival to departure, every
                      detail is designed around your
                      comfort.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* =================================================
              RIGHT IMAGE
          ================================================= */}

          <div
            className="
              flex
              items-center
              justify-center

              lg:justify-end
            "
          >
            <div
              className="
                relative
                w-full
                max-w-[610px]
              "
            >
              <div
                className="
                  relative

                  aspect-square
                  w-full

                  overflow-hidden

                  shadow-[0_30px_80px_rgba(0,0,0,0.14)]

                  will-change-transform
                "
                style={{
                  transform: `translate3d(
                    0,
                    ${imageMove}px,
                    0
                  )`,
                }}
              >
                {/* HOTEL IMAGES */}

                {hotelImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Luxury Hotel ${index + 1}`}
                    className={`
                      absolute
                      inset-[-5%]

                      h-[110%]
                      w-[110%]

                      object-cover

                      transition-opacity
                      duration-[1300ms]

                      ease-[cubic-bezier(.22,1,.36,1)]

                      will-change-transform

                      ${
                        hotelIndex === index
                          ? "opacity-100"
                          : "opacity-0"
                      }
                    `}
                    style={{
                      transform: `translate3d(
                        0,
                        ${innerImageMove}px,
                        0
                      )`,
                    }}
                  />
                ))}

                {/* IMAGE OVERLAY */}

                <div
                  className="
                    pointer-events-none

                    absolute
                    inset-0
                    z-[5]

                    bg-gradient-to-t

                    from-black/10
                    via-transparent
                    to-transparent
                  "
                />

                {/* ===========================================
                    TILE TRANSITION
                =========================================== */}

                <div
                  className="
                    pointer-events-none

                    absolute
                    inset-0
                    z-10

                    grid
                    grid-cols-4
                    grid-rows-4
                  "
                >
                  {Array.from({
                    length: 16,
                  }).map((_, index) => {
                    const delay =
                      diagonalDelays[index];

                    let animationName = "none";
                    let transform = "scale(0)";

                    if (
                      tilePhase === "initial"
                    ) {
                      transform = "scale(1.025)";
                    }

                    if (
                      tilePhase === "cover"
                    ) {
                      animationName =
                        "hotelTileCover";

                      transform = "scale(0)";
                    }

                    if (
                      tilePhase === "reveal"
                    ) {
                      animationName =
                        "hotelTileReveal";

                      transform = "scale(1.025)";
                    }

                    return (
                      <div
                        key={`${tilePhase}-${index}`}
                        className="
                          will-change-transform
                        "
                        style={{
                          backgroundColor:
                            tileColors[
                              transitionColorIndex
                            ],

                          transform,

                          animationName,

                          animationDuration:
                            "760ms",

                          animationDelay:
                            `${delay}ms`,

                          animationTimingFunction:
                            "cubic-bezier(.76,0,.24,1)",

                          animationFillMode:
                            "forwards",

                          backfaceVisibility:
                            "hidden",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ANIMATION CSS
      ===================================================== */}

      <style>
        {`
          @keyframes hotelTileCover {
            0% {
              transform: scale(0);
            }

            100% {
              transform: scale(1.025);
            }
          }

          @keyframes hotelTileReveal {
            0% {
              transform: scale(1.025);
            }

            100% {
              transform: scale(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .will-change-transform {
              will-change: auto;
            }
          }
        `}
      </style>
    </>
  );
};

export default GridImageChnager;