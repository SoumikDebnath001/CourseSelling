import React, {
  useEffect,
  useRef,
  useState,
} from "react";

/* =========================================================
   DATA
========================================================= */

const panelSlides = [
  {
    left: {
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=90",
      number: "01 — STAY",
      title: "Luxury Rooms",
      description:
        "Beautiful spaces designed around comfort, relaxation and unforgettable stays.",
    },

    center: {
      image:
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=90",
      number: "02 — TASTE",
      title: "Fine Dining",
      description:
        "Carefully crafted dishes and exceptional flavours for every occasion.",
    },

    right: {
      image:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=90",
      number: "03 — RELAX",
      title: "Pool & Wellness",
      description:
        "Relax, recharge and enjoy a peaceful escape designed around you.",
    },
  },

  {
    left: {
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=90",
      number: "01 — SUITES",
      title: "Premium Suites",
      description:
        "Elegant suites combining privacy, space and exceptional comfort.",
    },

    center: {
      image:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=90",
      number: "02 — MORNING",
      title: "Fresh Breakfast",
      description:
        "Start your morning with fresh ingredients and carefully prepared favourites.",
    },

    right: {
      image:
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1600&q=90",
      number: "03 — SPA",
      title: "Spa Retreat",
      description:
        "Slow down, unwind and rediscover your balance.",
    },
  },

  {
    left: {
      image:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=90",
      number: "01 — ESCAPE",
      title: "Private Villas",
      description:
        "Private spaces created for quiet escapes and unforgettable experiences.",
    },

    center: {
      image:
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1600&q=90",
      number: "02 — EVENING",
      title: "Rooftop Dining",
      description:
        "Beautiful evenings, exceptional cuisine and unforgettable views.",
    },

    right: {
      image:
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=90",
      number: "03 — WATER",
      title: "Infinity Pool",
      description:
        "Relax by the water with beautiful views stretching beyond the horizon.",
    },
  },

  {
    left: {
      image:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=90",
      number: "01 — SIGNATURE",
      title: "Signature Stay",
      description:
        "A carefully designed hotel experience created to feel extraordinary.",
    },

    center: {
      image:
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=90",
      number: "02 — PRIVATE",
      title: "Private Dining",
      description:
        "Personal dining experiences created for your most memorable occasions.",
    },

    right: {
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=90",
      number: "03 — RESET",
      title: "Complete Wellness",
      description:
        "Rest, recharge and leave feeling completely refreshed.",
    },
  },
];

/* =========================================================
   HELPERS
========================================================= */

const clamp = (value, min, max) => {
  return Math.min(
    Math.max(value, min),
    max
  );
};

const rangeProgress = (
  progress,
  start,
  end
) => {
  return clamp(
    (progress - start) /
      (end - start),
    0,
    1
  );
};

/* =========================================================
   PANEL
========================================================= */

const Panel = ({
  position,
  stage1,
  stage2,
  stage3,
  activeState,
}) => {
  const isCenter =
    position === "center";

  const images =
    panelSlides.map(
      (slide) =>
        slide[position].image
    );

  const content =
    panelSlides[activeState][
      position
    ];

  /* =======================================================
     IMAGE REVEAL DIRECTIONS

     LEFT / RIGHT:
     bottom -> top

     CENTER:
     top -> bottom

     Directions alternate on each stage.
  ======================================================= */

  const firstClip =
    isCenter
      ? `inset(0 0 ${
          100 -
          stage1 * 100
        }% 0)`
      : `inset(${
          100 -
          stage1 * 100
        }% 0 0 0)`;

  const secondClip =
    isCenter
      ? `inset(${
          100 -
          stage2 * 100
        }% 0 0 0)`
      : `inset(0 0 ${
          100 -
          stage2 * 100
        }% 0)`;

  const thirdClip =
    isCenter
      ? `inset(0 0 ${
          100 -
          stage3 * 100
        }% 0)`
      : `inset(${
          100 -
          stage3 * 100
        }% 0 0 0)`;

  return (
    <div
      className={`
        relative
        h-full
        overflow-hidden
        bg-[#111]

        ${
          position !== "left"
            ? "border-l border-white/15"
            : ""
        }
      `}
    >
      {/* ===================================================
          BASE IMAGE

          NO SCALE
          NO PARALLAX
      =================================================== */}

      <img
        src={images[0]}
        alt=""
        className="
          absolute
          inset-0
          z-[1]
          h-full
          w-full
          object-cover
        "
      />

      {/* ===================================================
          LAYER 1
      =================================================== */}

      <img
        src={images[1]}
        alt=""
        className="
          absolute
          inset-0
          z-[2]
          h-full
          w-full
          object-cover
          will-change-[clip-path]
        "
        style={{
          clipPath: firstClip,
        }}
      />

      {/* ===================================================
          LAYER 2
      =================================================== */}

      <img
        src={images[2]}
        alt=""
        className="
          absolute
          inset-0
          z-[3]
          h-full
          w-full
          object-cover
          will-change-[clip-path]
        "
        style={{
          clipPath: secondClip,
        }}
      />

      {/* ===================================================
          LAYER 3
      =================================================== */}

      <img
        src={images[3]}
        alt=""
        className="
          absolute
          inset-0
          z-[4]
          h-full
          w-full
          object-cover
          will-change-[clip-path]
        "
        style={{
          clipPath: thirdClip,
        }}
      />

      {/* ===================================================
          IMAGE OVERLAY
      =================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-10
          bg-gradient-to-t
          from-black/80
          via-black/15
          to-black/5
        "
      />

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div
        key={`${position}-${activeState}`}
        className="
          panel-content-enter
          pointer-events-none
          absolute
          bottom-8
          left-6
          right-6
          z-20
          text-white

          sm:bottom-10
          sm:left-8
          sm:right-8

          lg:bottom-12
          lg:left-10
          lg:right-10
        "
      >
        <span
          className="
            mb-3
            block
            font-mono
            text-[9px]
            tracking-[0.2em]
            text-white/65

            sm:text-[10px]
          "
        >
          {content.number}
        </span>

        <h2
          className="
            font-serif
            text-[24px]
            font-normal
            leading-[0.95]
            tracking-[-0.045em]

            sm:text-4xl
            lg:text-5xl
            xl:text-6xl
          "
        >
          {content.title}
        </h2>

        <p
          className="
            mt-4
            hidden
            max-w-[300px]
            text-xs
            leading-[1.65]
            text-white/70

            sm:block
          "
        >
          {content.description}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   COMPONENT
========================================================= */

const ThreeGirdDisplay = () => {
  const sectionRef =
    useRef(null);

  const [
    progress,
    setProgress,
  ] = useState(0);

  /* =========================================================
     SCROLL
  ========================================================= */

  useEffect(() => {
    let ticking = false;

    const updateSection =
      () => {
        if (
          !sectionRef.current
        ) {
          ticking = false;
          return;
        }

        const section =
          sectionRef.current;

        const rect =
          section.getBoundingClientRect();

        const distance =
          section.offsetHeight -
          window.innerHeight;

        const nextProgress =
          clamp(
            -rect.top /
              distance,
            0,
            1
          );

        setProgress(
          nextProgress
        );

        ticking = false;
      };

    const handleScroll =
      () => {
        if (!ticking) {
          requestAnimationFrame(
            updateSection
          );

          ticking = true;
        }
      };

    updateSection();

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

  /* =========================================================
     STAGES
  ========================================================= */

  const stage1 =
    rangeProgress(
      progress,
      0,
      0.333
    );

  const stage2 =
    rangeProgress(
      progress,
      0.333,
      0.666
    );

  const stage3 =
    rangeProgress(
      progress,
      0.666,
      1
    );

  /* =========================================================
     ACTIVE STATE
  ========================================================= */

  let activeState = 0;

  if (progress >= 0.2) {
    activeState = 1;
  }

  if (progress >= 0.52) {
    activeState = 2;
  }

  if (progress >= 0.85) {
    activeState = 3;
  }

  /* =========================================================
     BACKGROUND IMAGE

     Use center image from current state.
  ========================================================= */

  const backgroundImage =
    panelSlides[activeState]
      .center.image;

  return (
    <>
      <section
        ref={sectionRef}
        className="
          relative
          h-[400vh]
          bg-stone-950
        "
      >
        <div
          className="
            sticky
            top-0
            flex
            h-screen
            w-full
            items-center
            justify-center
            overflow-hidden
            bg-stone-950

            px-3
            sm:px-5
            lg:px-8
          "
        >
          {/* =================================================
              BLURRED BACKGROUND
          ================================================= */}

          <div
            className="
              absolute
              inset-0
              overflow-hidden
            "
          >
            {panelSlides.map(
              (slide, index) => (
                <img
                  key={index}
                  src={
                    slide.center
                      .image
                  }
                  alt=""
                  className={`
                    absolute
                    -inset-[6%]

                    h-[112%]
                    w-[112%]

                    object-cover

                    blur-[55px]

                    transition-opacity
                    duration-1000

                    ${
                      index ===
                      activeState
                        ? "opacity-60"
                        : "opacity-0"
                    }
                  `}
                />
              )
            )}

            {/* DARK BLUR LAYER */}

            <div
              className="
                absolute
                inset-0
                bg-black/45
                backdrop-blur-md
              "
            />

            {/* GRADIENT */}

            <div
              className="
                absolute
                inset-0

                bg-gradient-to-b
                from-black/20
                via-transparent
                to-black/40
              "
            />
          </div>

          {/* =================================================
              MAIN CONTAINER

              Larger than WindowImageGlalary

              Previous = 58vh / 1150px

              This = 76vh / 1450px
          ================================================= */}

          <div
            className="
              relative
              z-20

              h-[76vh]
              min-h-[500px]
              max-h-[800px]

              w-full
              max-w-[1450px]

              overflow-hidden

              rounded-[26px]

              border
              border-white/15

              bg-black/20

              shadow-2xl
            "
          >
            {/* ===============================================
                TOP BAR
            =============================================== */}

            <div
              className="
                pointer-events-none
                absolute
                left-6
                right-6
                top-6
                z-50

                flex
                items-center
                justify-between

                text-white

                sm:left-8
                sm:right-8
              "
            >
              <div
                className="
                  font-serif
                  text-lg
                  tracking-[0.08em]

                  sm:text-xl
                "
              >
                HOTEL.
              </div>

              <div
                className="
                  text-[8px]
                  uppercase
                  tracking-[0.25em]
                  text-white/70

                  sm:text-[9px]
                "
              >
                Scroll to explore ↓
              </div>
            </div>

            {/* ===============================================
                THREE PANELS
            =============================================== */}

            <div
              className="
                absolute
                inset-0

                grid
                h-full
                w-full

                grid-cols-3
              "
            >
              <Panel
                position="left"
                stage1={
                  stage1
                }
                stage2={
                  stage2
                }
                stage3={
                  stage3
                }
                activeState={
                  activeState
                }
              />

              <Panel
                position="center"
                stage1={
                  stage1
                }
                stage2={
                  stage2
                }
                stage3={
                  stage3
                }
                activeState={
                  activeState
                }
              />

              <Panel
                position="right"
                stage1={
                  stage1
                }
                stage2={
                  stage2
                }
                stage3={
                  stage3
                }
                activeState={
                  activeState
                }
              />
            </div>

            {/* ===============================================
                PROGRESS
            =============================================== */}

            <div
              className="
                pointer-events-none
                absolute
                bottom-5
                right-6
                z-50

                font-mono
                text-[10px]
                text-white/70

                sm:right-8
              "
            >
              {String(
                activeState + 1
              ).padStart(
                2,
                "0"
              )}

              {" / 04"}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT ANIMATION
      ===================================================== */}

      <style>
        {`
          @keyframes panelContentEnter {
            0% {
              opacity: 0;
              transform: translateY(15px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .panel-content-enter {
            animation:
              panelContentEnter
              550ms
              cubic-bezier(.22,1,.36,1)
              both;
          }
        `}
      </style>
    </>
  );
};

export default ThreeGirdDisplay;