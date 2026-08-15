import React, { useEffect, useRef, useState } from "react";
import HeroSlide1 from "../../../assets/Homepage/HeroSlide1.png";
import HeroSlide2 from "../../../assets/Homepage/HeroSlide2.png";
import HeroSlide3 from "../../../assets/Homepage/HeroSlide3.png";

/* =========================================================
   SLIDE DATA
========================================================= */

const slides = [
  {
    title: "",
    eyebrow: "",
    hero: HeroSlide1,

    surrounding: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
    ],
  },

  {
    title: "Comfort",
    eyebrow: "PREMIUM SUITES",
    hero: HeroSlide2,

    surrounding: [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1594563703937-fdc640497dcd?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=900&q=80",
    ],
  },

  {
    title: "",
    eyebrow: "",
    hero: HeroSlide3,

    surrounding: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=900&q=80",
    ],
  },
];

/* =========================================================
   HELPERS
========================================================= */

const clamp = (value, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

const lerp = (start, end, progress) =>
  start + (end - start) * progress;

const smooth = (value) => {
  value = clamp(value);
  return value * value * (3 - 2 * value);
};

/* =========================================================
   COMPONENT
========================================================= */

const HeroSlideBackground = () => {
  const sectionRef = useRef(null);
  const centerRef = useRef(null);

  const animationRef = useRef(null);
  const isAnimatingRef = useRef(false);

  const [progress, setProgress] = useState(0);

  const [viewport, setViewport] = useState({
    width:
      typeof window !== "undefined"
        ? window.innerWidth
        : 1920,

    height:
      typeof window !== "undefined"
        ? window.innerHeight
        : 1080,
  });

  /* ========================================================
     HIDE SCROLLBAR
  ======================================================== */

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      html {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      html::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }

      body {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      body::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  /* ========================================================
     GET CURRENT PROGRESS
  ======================================================== */

  const getProgress = () => {
    if (!sectionRef.current) {
      return 0;
    }

    const section =
      sectionRef.current;

    const rect =
      section.getBoundingClientRect();

    const distance =
      section.offsetHeight -
      window.innerHeight;

    if (distance <= 0) {
      return 0;
    }

    return clamp(
      -rect.top / distance,
      0,
      1
    );
  };

  /* ========================================================
     UPDATE PROGRESS
  ======================================================== */

  const updateProgress = () => {
    const value =
      getProgress();

    setProgress(value);

    setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  /* ========================================================
     CUSTOM SCROLL ANIMATION
     
     THIS IS THE IMPORTANT PART
  ======================================================== */

  const animateToProgress = (
    targetProgress
  ) => {
    if (
      !sectionRef.current ||
      isAnimatingRef.current
    ) {
      return;
    }

    const section =
      sectionRef.current;

    const sectionTop =
      window.scrollY +
      section.getBoundingClientRect()
        .top;

    const maxScroll =
      section.offsetHeight -
      window.innerHeight;

    const startScroll =
      window.scrollY;

    const targetScroll =
      sectionTop +
      targetProgress *
        maxScroll;

    const distance =
      targetScroll -
      startScroll;

    /*
      Animation duration.
      Increase this if you want slower.
    */

    const duration = 1100;

    const startTime =
      performance.now();

    isAnimatingRef.current =
      true;

    const animate = (currentTime) => {
      const elapsed =
        currentTime -
        startTime;

      const rawProgress =
        clamp(
          elapsed / duration
        );

      /*
        Smooth ease-in-out.
        This makes the image movement
        clearly visible.
      */

      const eased =
        rawProgress < 0.5
          ? 2 *
            rawProgress *
            rawProgress
          : 1 -
            Math.pow(
              -2 *
                rawProgress +
                2,
              2
            ) /
              2;

      const currentScroll =
        startScroll +
        distance * eased;

      window.scrollTo(
        0,
        currentScroll
      );

      /*
        Immediately synchronize
        React animation with scroll.
      */

      const currentProgress =
        maxScroll > 0
          ? clamp(
              (currentScroll -
                sectionTop) /
                maxScroll,
              0,
              1
            )
          : 0;

      setProgress(
        currentProgress
      );

      if (
        rawProgress < 1
      ) {
        animationRef.current =
          requestAnimationFrame(
            animate
          );
      } else {
        /*
          Snap exactly to the requested scene.
          This prevents floating-point scroll positions
          such as 0.499999 / 0.500001 from confusing
          the next wheel interaction.
        */

        window.scrollTo({
          top: targetScroll,
          left: 0,
          behavior: "instant",
        });

        setProgress(
          targetProgress
        );

        isAnimatingRef.current =
          false;

        animationRef.current =
          null;
      }
    };

    animationRef.current =
      requestAnimationFrame(
        animate
      );
  };

  /* ========================================================
     FIND NEXT SCENE

     Exact 3-slide behavior:
     Slide 1 → Slide 2 → Slide 3 → next section

     IMPORTANT:
     We use fixed scene boundaries instead of Math.ceil/floor
     so scrolling back from Slide 2 can never target Slide 2
     itself.
  ======================================================== */

  const moveScene = (direction) => {
    if (
      !sectionRef.current ||
      isAnimatingRef.current
    ) {
      return;
    }

    const currentProgress = getProgress();

    /*
      There are exactly 2 transitions:
      0.00 → 0.50 = Slide 1 → Slide 2
      0.50 → 1.00 = Slide 2 → Slide 3
    */

    const FIRST_SLIDE_END = 0.5;
    const SECOND_SLIDE_END = 1;

    /*
      SCROLL DOWN
    */

    if (direction > 0) {
      /*
        Slide 1 → Slide 2
      */

      if (currentProgress < 0.25) {
        animateToProgress(
          FIRST_SLIDE_END
        );
        return;
      }

      /*
        Slide 2 → Slide 3
      */

      if (
        currentProgress >= 0.25 &&
        currentProgress < 0.99
      ) {
        animateToProgress(
          SECOND_SLIDE_END
        );
        return;
      }

      /*
        Slide 3 → allow normal browser
        scrolling into the next section.
      */

      return;
    }

    /*
      SCROLL UP
    */

    if (direction < 0) {
      /*
        Slide 3 → Slide 2
      */

      if (currentProgress > 0.75) {
        animateToProgress(
          FIRST_SLIDE_END
        );
        return;
      }

      /*
        Slide 2 → Slide 1

        Anything around the middle is
        explicitly sent to 0 instead of
        calculating another scene index.
      */

      if (currentProgress > 0.001) {
        animateToProgress(0);
        return;
      }

      /*
        Slide 1 → allow normal browser
        scrolling into the previous section.
      */

      return;
    }
  };

  /* ========================================================
     SCROLL EVENT
  ======================================================== */

  useEffect(() => {
    const handleScroll = () => {
      if (
        !isAnimatingRef.current
      ) {
        updateProgress();
      }
    };

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      updateProgress();
    };

    updateProgress();

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  /* ========================================================
     WHEEL CONTROL
  ======================================================== */

  useEffect(() => {
    let wheelLocked = false;

    const handleWheel = (
      event
    ) => {
      /*
        Only react to meaningful
        wheel movement.
      */

      if (
        Math.abs(event.deltaY) < 5
      ) {
        return;
      }

      const currentProgress =
        getProgress();

      /*
        Only take over the wheel
        while the hero is active.
      */

      const section =
        sectionRef.current;

      if (!section) {
        return;
      }

      const rect =
        section.getBoundingClientRect();

      const insideSection =
        rect.top <= 1 &&
        rect.bottom >=
          window.innerHeight - 1;

      /*
        At the exact beginning/end,
        let the normal page scroll.
      */

      if (
        !insideSection
      ) {
        return;
      }

      if (
        isAnimatingRef.current
      ) {
        event.preventDefault();
        return;
      }

      /*
        At final scene, allow scrolling
        into the next section.
      */

      if (
        event.deltaY > 0 &&
        currentProgress >=
          0.999
      ) {
        return;
      }

      /*
        At first scene, allow scrolling
        back to the previous page.
      */

      if (
        event.deltaY < 0 &&
        currentProgress <=
          0.001
      ) {
        return;
      }

      event.preventDefault();

      if (wheelLocked) {
        return;
      }

      wheelLocked = true;

      moveScene(
        event.deltaY > 0
          ? 1
          : -1
      );

      /*
        Prevent trackpad from generating
        multiple scene changes.
      */

      setTimeout(() => {
        wheelLocked = false;
      }, 1150);
    };

    window.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: false,
      }
    );

    return () => {
      window.removeEventListener(
        "wheel",
        handleWheel
      );
    };
  }, []);

  /* ========================================================
     KEYBOARD SUPPORT
  ======================================================== */

  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      if (
        event.key ===
          "ArrowDown" ||
        event.key ===
          "PageDown"
      ) {
        event.preventDefault();

        moveScene(1);
      }

      if (
        event.key ===
          "ArrowUp" ||
        event.key ===
          "PageUp"
      ) {
        event.preventDefault();

        moveScene(-1);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* ========================================================
     CLEANUP ANIMATION
  ======================================================== */

  useEffect(() => {
    return () => {
      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, []);

  /* ========================================================
     TIMELINE

     3 slides = 2 transition intervals.
     This prevents Slide 3 from being rendered as a
     separate Slide 3 → Slide 3 transition.
  ======================================================== */

  const count = slides.length;

  const totalTransitions = count - 1;

  const timeline =
    progress * totalTransitions;

  // There are only TWO transition intervals:
  // Slide 1 → Slide 2
  // Slide 2 → Slide 3
  // Never create a Slide 3 → Slide 3 interval.
  const sceneIndex = Math.min(
    Math.floor(timeline),
    count - 2
  );

  let localProgress =
    timeline - sceneIndex;

  // Once the final position is reached,
  // keep Slide 3 fully visible.
  if (progress >= 0.999) {
    localProgress = 1;
  }

  localProgress = clamp(localProgress);

  const nextIndex = Math.min(
    sceneIndex + 1,
    count - 1
  );

  /* ========================================================
     HERO EXPANSION
  ======================================================== */

  let heroExpansion = 0;

  /*
    FULLSCREEN → GRID
  */

  if (
    localProgress <= 0.25
  ) {
    heroExpansion =
      1 -
      localProgress /
        0.25;
  }

  /*
    GRID → FULLSCREEN
  */

  else if (
    localProgress >= 0.7
  ) {
    heroExpansion =
      (localProgress - 0.7) /
      0.3;
  }

  heroExpansion =
    smooth(
      heroExpansion
    );

  /* ========================================================
     GRID TRANSITION
  ======================================================== */

  const gridTransition =
    smooth(
      clamp(
        (localProgress - 0.15) /
          0.7
      )
    );

  /* ========================================================
     HERO SCENE
  ======================================================== */

  const showingNext =
    localProgress >= 0.7 &&
    sceneIndex < count - 1;

  const heroScene =
    showingNext
      ? nextIndex
      : sceneIndex;

  const heroData =
    slides[heroScene];

  /* ========================================================
     HERO POSITION
  ======================================================== */

  let heroStyle = {
    left: "0px",
    top: "0px",
    width: "100vw",
    height: "100vh",
    borderRadius: "0px",
  };

  if (
    centerRef.current &&
    progress > 0
  ) {
    const rect =
      centerRef.current.getBoundingClientRect();

    heroStyle = {
      left: `${lerp(
        rect.left,
        0,
        heroExpansion
      )}px`,

      top: `${lerp(
        rect.top,
        0,
        heroExpansion
      )}px`,

      width: `${lerp(
        rect.width,
        viewport.width,
        heroExpansion
      )}px`,

      height: `${lerp(
        rect.height,
        viewport.height,
        heroExpansion
      )}px`,

      borderRadius: `${lerp(
        8,
        0,
        heroExpansion
      )}px`,
    };
  }

  /* ========================================================
     CENTER MOVEMENT
  ======================================================== */

  const currentCenterY =
    -gridTransition *
    100;

  const nextCenterY =
    100 -
    gridTransition *
    100;

  /* ========================================================
     DIRECTION
  ======================================================== */

  const getDirection = (
    index
  ) => {
    const leftColumn =
      index === 0 ||
      index === 3 ||
      index === 5;

    const rightColumn =
      index === 2 ||
      index === 4 ||
      index === 7;

    if (leftColumn) {
      return 1;
    }

    if (rightColumn) {
      return -1;
    }

    return -1;
  };

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <section
      ref={sectionRef}
      className="
        relative
        h-[300vh]
        bg-[#efefed]
      "
    >
      {/* ===================================================
          STICKY VIEWPORT
      =================================================== */}

      <div
        className="
          sticky
          top-0
          h-screen
          w-full
          overflow-hidden
          bg-[#efefed]
        "
      >
        {/* =================================================
            GRID
        ================================================= */}

        <div
          className="
            absolute
            inset-0
            h-screen
            w-screen
          "
        >
          <div
            className="
              absolute
              inset-0
              grid
              h-screen
              w-screen
              grid-cols-[22%_56%_22%]
              grid-rows-[20%_60%_20%]
              gap-[3px]
              bg-[#efefed]
            "
          >
            <GridBlock
              position="col-start-1 row-start-1"
              index={0}
              current={slides[sceneIndex]}
              next={slides[nextIndex]}
              transition={gridTransition}
              direction={getDirection(0)}
            />

            <GridBlock
              position="col-start-2 row-start-1"
              index={1}
              current={slides[sceneIndex]}
              next={slides[nextIndex]}
              transition={gridTransition}
              direction={getDirection(1)}
            />

            <GridBlock
              position="col-start-3 row-start-1"
              index={2}
              current={slides[sceneIndex]}
              next={slides[nextIndex]}
              transition={gridTransition}
              direction={getDirection(2)}
            />

            <GridBlock
              position="col-start-1 row-start-2"
              index={3}
              current={slides[sceneIndex]}
              next={slides[nextIndex]}
              transition={gridTransition}
              direction={getDirection(3)}
            />

            {/* CENTER */}

            <div
              ref={centerRef}
              className="
                relative
                col-start-2
                row-start-2
                overflow-hidden
                bg-black
              "
            >
              <img
                src={
                  slides[
                    sceneIndex
                  ].hero
                }
                alt=""
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-cover
                  will-change-transform
                "
                style={{
                  transform:
                    `translateY(${currentCenterY}%)`,
                }}
              />

              {sceneIndex <
                count - 1 && (
                <img
                  src={
                    slides[
                      nextIndex
                    ].hero
                  }
                  alt=""
                  className="
                    absolute
                    inset-0
                    h-full
                    w-full
                    object-cover
                    will-change-transform
                  "
                  style={{
                    transform:
                      `translateY(${nextCenterY}%)`,
                  }}
                />
              )}
            </div>

            <GridBlock
              position="col-start-3 row-start-2"
              index={4}
              current={slides[sceneIndex]}
              next={slides[nextIndex]}
              transition={gridTransition}
              direction={getDirection(4)}
            />

            <GridBlock
              position="col-start-1 row-start-3"
              index={5}
              current={slides[sceneIndex]}
              next={slides[nextIndex]}
              transition={gridTransition}
              direction={getDirection(5)}
            />

            <GridBlock
              position="col-start-2 row-start-3"
              index={6}
              current={slides[sceneIndex]}
              next={slides[nextIndex]}
              transition={gridTransition}
              direction={getDirection(6)}
            />

            <GridBlock
              position="col-start-3 row-start-3"
              index={7}
              current={slides[sceneIndex]}
              next={slides[nextIndex]}
              transition={gridTransition}
              direction={getDirection(7)}
            />
          </div>
        </div>

        {/* =================================================
            EXPANDING HERO
        ================================================= */}

        <div
          className="
            pointer-events-none
            fixed
            left-0
            top-0
            z-50
            h-screen
            w-screen
            overflow-hidden
            bg-black
            will-change-[left,top,width,height]
          "
          style={heroStyle}
        >
          <img
            src={heroData.hero}
            alt={heroData.title}
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black/60
              via-black/10
              to-transparent
            "
          />

          {/* CONTENT */}

          <div
            className="
              absolute
              left-1/2
              top-1/2
              w-[90%]
              -translate-x-1/2
              -translate-y-1/2
              text-center
              text-white
            "
            style={{
              opacity: clamp(
                (heroExpansion -
                  0.35) /
                  0.35
              ),
            }}
          >
            <p
              className="
                mb-3
                font-mono
                text-[11px]
                font-medium
                uppercase
                tracking-[0.25em]
              "
            >
              {heroData.eyebrow}
            </p>

            <h1
              className="
                text-5xl
                font-semibold
                leading-[0.9]
                tracking-[-0.05em]
                sm:text-7xl
                lg:text-8xl
              "
            >
              {heroData.title}
            </h1>
          </div>

          {/* COUNTER */}

          <div
            className="
              absolute
              bottom-6
              right-6
              font-mono
              text-[11px]
              text-white/90
            "
          >
            {String(
              heroScene + 1
            ).padStart(2, "0")}

            {" / "}

            {String(
              count
            ).padStart(2, "0")}
          </div>
        </div>
      </div>
    </section>
  );
};

/* =========================================================
   GRID BLOCK
========================================================= */

const GridBlock = ({
  position,
  index,
  current,
  next,
  transition,
  direction,
}) => {
  const currentY =
    direction *
    transition *
    100;

  const nextStart =
    direction === 1
      ? -100
      : 100;

  const nextY =
    nextStart +
    direction *
      transition *
      100;

  return (
    <div
      className={`
        ${position}
        relative
        overflow-hidden
        bg-stone-200
      `}
    >
      {/* CURRENT */}

      <img
        src={
          current.surrounding[
            index
          ]
        }
        alt=""
        className="
          absolute
          inset-0
          h-full
          w-full
          object-cover
          will-change-transform
        "
        style={{
          transform:
            `translateY(${currentY}%)`,
        }}
      />

      {/* NEXT */}

      <img
        src={
          next.surrounding[
            index
          ]
        }
        alt=""
        className="
          absolute
          inset-0
          h-full
          w-full
          object-cover
          will-change-transform
        "
        style={{
          transform:
            `translateY(${nextY}%)`,
        }}
      />
    </div>
  );
};

export default HeroSlideBackground;