import React, { useEffect, useState } from "react";

/* =========================================================
   GALLERY DATA
========================================================= */

const galleryImages = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=90",
    title: "Luxury Escape",
    description: "Where every stay becomes an experience.",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=90",
    title: "Premium Suites",
    description: "Comfort crafted around your journey.",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=90",
    title: "Beautiful Stays",
    description: "Discover spaces worth remembering.",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=90",
    title: "Ocean Retreat",
    description: "Wake up somewhere extraordinary.",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=90",
    title: "Private Getaway",
    description: "Your perfect escape awaits.",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

const WindowImageGlalary = () => {
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  /* =========================================================
     AUTO PLAY
  ========================================================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGalleryIndex(
        (current) =>
          (current + 1) % galleryImages.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const activeImage =
    galleryImages[activeGalleryIndex];

  return (
    <section
      className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-black
        px-4
        py-20
        sm:px-8
      "
    >
      {/* =====================================================
          BLURRED BACKGROUND
      ===================================================== */}

      <div className="absolute inset-0 overflow-hidden">
        {galleryImages.map((image, index) => (
          <img
            key={image.id}
            src={image.src}
            alt=""
            className={`
              absolute
              -inset-[5%]
              h-[110%]
              w-[110%]
              object-cover
              blur-[45px]

              transition-opacity
              duration-500
              ease-out

              ${
                index === activeGalleryIndex
                  ? "opacity-60"
                  : "opacity-0"
              }
            `}
          />
        ))}

        {/* DARK LAYER */}

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
            from-black/10
            via-transparent
            to-black/30
          "
        />
      </div>

      {/* =====================================================
          MAIN GALLERY
      ===================================================== */}

      <div
        className="
          relative
          z-10

          h-[58vh]
          min-h-[420px]
          max-h-[650px]

          w-full
          max-w-[1150px]

          overflow-hidden
          rounded-[24px]

          border
          border-white/15

          bg-black/20

          shadow-2xl
          backdrop-blur-sm
        "
      >
        <div
          className="
            flex
            h-full
            w-full
            gap-[3px]
            overflow-hidden
          "
        >
          {galleryImages.map(
            (image, index) => {
              const isActive =
                activeGalleryIndex === index;

              return (
                <div
                  key={image.id}
                  onClick={() =>
                    setActiveGalleryIndex(
                      index
                    )
                  }
                  className={`
                    relative
                    h-full
                    min-w-0
                    cursor-pointer
                    overflow-hidden

                    transition-[flex-grow]
                    duration-[600ms]
                    ease-[cubic-bezier(.76,0,.24,1)]

                    ${
                      isActive
                        ? "grow-[12]"
                        : "grow"
                    }
                  `}
                  style={{
                    flexBasis: 0,
                  }}
                >
                  {/* =========================================
                      IMAGE
                  ========================================= */}

                  <img
                    src={image.src}
                    alt={image.title}
                    className="
                      absolute
                      inset-0
                      h-full
                      w-full
                      object-cover
                    "
                  />

                  {/* =========================================
                      OVERLAY
                  ========================================= */}

                  <div
                    className={`
                      absolute
                      inset-0

                      transition-colors
                      duration-500
                      ease-out

                      ${
                        isActive
                          ? "bg-black/10"
                          : "bg-black/50"
                      }
                    `}
                  />

                  {/* =========================================
                      ACTIVE CONTENT
                  ========================================= */}

                  <div
                    className={`
                      absolute
                      bottom-8
                      left-8
                      z-10

                      max-w-[500px]

                      transition-all
                      duration-400
                      ease-out

                      ${
                        isActive
                          ? "translate-y-0 opacity-100 delay-150"
                          : "translate-y-5 opacity-0"
                      }
                    `}
                  >
                    <p
                      className="
                        mb-2
                        font-mono
                        text-[10px]
                        uppercase
                        tracking-[0.25em]
                        text-white/70
                      "
                    >
                      ComfyStay
                    </p>

                    <h2
                      className="
                        whitespace-nowrap
                        text-3xl
                        font-medium
                        tracking-[-0.04em]
                        text-white

                        sm:text-4xl
                        lg:text-5xl
                      "
                    >
                      {image.title}
                    </h2>

                    <p
                      className="
                        mt-3
                        text-sm
                        text-white/75
                      "
                    >
                      {image.description}
                    </p>
                  </div>

                  {/* =========================================
                      NUMBER
                  ========================================= */}

                  <div
                    className="
                      absolute
                      right-4
                      top-4
                      z-10
                    "
                  >
                    <span
                      className="
                        font-mono
                        text-[10px]
                        text-white/70
                      "
                    >
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* =====================================================
          BOTTOM ACTIVE INDICATOR
      ===================================================== */}

      <div
        className="
          absolute
          bottom-8
          left-1/2
          z-10
          flex
          -translate-x-1/2
          items-center
          gap-2
        "
      >
        {galleryImages.map(
          (image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Show ${image.title}`}
              onClick={() =>
                setActiveGalleryIndex(
                  index
                )
              }
              className={`
                h-[3px]
                rounded-full

                transition-all
                duration-300

                ${
                  index ===
                  activeGalleryIndex
                    ? "w-10 bg-white"
                    : "w-4 bg-white/30 hover:bg-white/60"
                }
              `}
            />
          )
        )}
      </div>
    </section>
  );
};

export default WindowImageGlalary;