import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowUpRight,
  FiStar,
  FiCoffee,
  FiDroplet,
  FiSun,
  FiUsers,
  FiHeart,
} from "react-icons/fi";
import Traveler from "../assets/ServicesPage/Traveler.svg";

/* =========================================================
   SERVICES DATA
========================================================= */

const services = [
  {
    icon: FiStar,
    title: "Luxury Rooms & Suites",
    description:
      "Spacious, beautifully designed rooms and premium suites with stunning views, plush bedding, and every modern amenity you could wish for.",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
  },
  {
    icon: FiCoffee,
    title: "Fine Dining & Cuisine",
    description:
      "From farm-to-table breakfasts to candlelit dinners, our award-winning chefs create dishes that celebrate local flavours and international excellence.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
  },
  {
    icon: FiDroplet,
    title: "Spa & Wellness",
    description:
      "Restore mind and body with signature treatments, thermal pools, and holistic wellness programs designed around your personal needs.",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80",
  },
  {
    icon: FiSun,
    title: "Pool & Fitness",
    description:
      "Infinity pools overlooking stunning landscapes, fully equipped fitness centres, and sunrise yoga sessions to energise your day.",
    image:
      "https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=900&q=80",
  },
  {
    icon: FiUsers,
    title: "Events & Celebrations",
    description:
      "Intimate weddings, corporate retreats, or milestone celebrations — our dedicated events team creates unforgettable experiences.",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
  },
  {
    icon: FiHeart,
    title: "24/7 Concierge",
    description:
      "From airport transfers to restaurant reservations and local adventures, our concierge team is here around the clock to make every moment special.",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
  },
];

/* =========================================================
   HIGHLIGHTS
========================================================= */

const highlights = [
  { number: "200+", label: "Luxury Rooms" },
  { number: "15+", label: "Award-Winning Chefs" },
  { number: "50+", label: "Spa Treatments" },
  { number: "98%", label: "Guest Satisfaction" },
];

/* =========================================================
   BACKGROUND
========================================================= */

const PAGE_BACKGROUND =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=90";

/* =========================================================
   GLASS PANEL
========================================================= */

const GlassPanel = ({ children, className = "" }) => {
  return (
    <div
      className={`
        rounded-3xl
        border border-white/15
        bg-black/20
        backdrop-blur-xl
        backdrop-saturate-150
        shadow-[0_20px_70px_rgba(0,0,0,0.22)]
        ${className}
      `}
    >
      {children}
    </div>
  );
};

/* =========================================================
   SERVICES PAGE
========================================================= */

const Services = () => {
  const navigate = useNavigate();

  /* =======================================================
     HIDE SCROLLBAR
  ======================================================= */

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      html {
        scrollbar-width: none;
      }

      body {
        scrollbar-width: none;
      }

      html::-webkit-scrollbar,
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

  return (
    <div className="relative min-h-screen overflow-hidden text-white">

      {/* =====================================================
          FIXED PARALLAX BACKGROUND
      ===================================================== */}

      <div className="fixed inset-0 -z-30">

        <img
          src={PAGE_BACKGROUND}
          alt=""
          className="
            absolute
            inset-0
            h-full
            w-full
            scale-[1.08]
            object-cover
            object-center
            will-change-transform
            blur-[2px]
          "
        />

        <div className="absolute inset-0 bg-black/40" />

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-black/30
            via-black/10
            to-black/55
          "
        />
      </div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="
          relative
          min-h-screen
          overflow-hidden
          bg-transparent
        "
      >

        <div
          className="
            relative
            z-10
            mx-auto
            grid
            min-h-screen
            w-full
            max-w-7xl
            items-center
            gap-10
            px-6
            pb-20
            pt-32
            sm:px-10
            lg:grid-cols-2
            lg:gap-16
            lg:px-16
          "
        >

          {/* =================================================
              LEFT — HERO TEXT
          ================================================= */}

          <div className="relative z-20">

            <GlassPanel
              className="
                max-w-3xl
                p-8
                sm:p-10
                lg:p-12
              "
            >

              <p
                className="
                  mb-5
                  flex
                  items-center
                  gap-3
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-amber-400
                "
              >
                <span className="h-px w-9 bg-amber-400/70" />

                Our Services
              </p>

              <h1
                className="
                  max-w-3xl
                  font-serif
                  text-5xl
                  leading-[0.98]
                  font-medium
                  tracking-[-0.035em]
                  text-white
                  sm:text-6xl
                  lg:text-7xl
                "
              >
                Exceptional experiences,{" "}
                <span className="italic text-white/70">
                  crafted for you.
                </span>
              </h1>

              <p
                className="
                  mt-7
                  max-w-xl
                  text-base
                  leading-8
                  text-white/80
                  sm:text-lg
                "
              >
                Every service at ComfyStay is designed around a single idea:
                making your stay feel effortless, personal, and extraordinary.
              </p>

            </GlassPanel>

          </div>

          {/* =================================================
              RIGHT — TRAVELER SVG
          ================================================= */}

          <div
            className="
              relative
              flex
              items-center
              justify-center
              lg:min-h-[620px]
            "
          >

            {/* Soft glow */}

            <div
              className="
                absolute
                h-[320px]
                w-[320px]
                rounded-full
                bg-amber-400/10
                blur-[100px]
              "
            />

            {/* Glass circle */}

            <div
              className="
                absolute
                h-[430px]
                w-[430px]
                rounded-full
                border
                border-white/10
                bg-white/[0.025]
                backdrop-blur-[2px]
              "
            />

            {/* Traveler illustration */}

            <img
              src={Traveler}
              alt="Traveler"
              className="
                relative
                z-10
                w-full
                max-w-[500px]
                object-contain
                drop-shadow-[0_30px_60px_rgba(0,0,0,0.45)]
                transition-transform
                duration-700
                hover:scale-[1.03]
              "
            />

          </div>

        </div>
      </section>

      {/* =====================================================
          HIGHLIGHTS
      ===================================================== */}

      <section
        className="
          relative
          bg-transparent
          px-6
          py-12
          sm:px-10
          lg:px-16
        "
      >

        <div className="mx-auto max-w-7xl">

          <GlassPanel className="p-7 sm:p-9 lg:p-10">

            <div
              className="
                grid
                grid-cols-2
                gap-8
                lg:grid-cols-4
                lg:gap-12
              "
            >

              {highlights.map(({ number, label }) => (
                <div
                  key={label}
                  className="text-center"
                >

                  <p
                    className="
                      font-serif
                      text-3xl
                      font-bold
                      text-amber-400
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
                      text-white/55
                    "
                  >
                    {label}
                  </p>

                </div>
              ))}

            </div>

          </GlassPanel>

        </div>
      </section>

      {/* =====================================================
          SERVICES GRID
      ===================================================== */}

      <section
        className="
          relative
          bg-transparent
          px-6
          py-20
          sm:px-10
          lg:px-16
          lg:py-28
        "
      >

        <div className="mx-auto max-w-7xl">

          {/* SECTION HEADER */}

          <GlassPanel
            className="
              mb-14
              p-7
              sm:p-9
              lg:p-10
            "
          >

            <p
              className="
                mb-4
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.2em]
                text-amber-400
              "
            >
              What We Offer
            </p>

            <div
              className="
                flex
                flex-col
                justify-between
                gap-6
                lg:flex-row
                lg:items-end
              "
            >

              <h2
                className="
                  max-w-xl
                  font-serif
                  text-4xl
                  leading-tight
                  tracking-[-0.025em]
                  text-white
                  sm:text-5xl
                "
              >
                Services designed around
                <span className="italic text-white/70">
                  {" "}your comfort.
                </span>
              </h2>

              <p
                className="
                  max-w-md
                  text-sm
                  leading-7
                  text-white/65
                  lg:text-right
                "
              >
                From the moment you arrive to the moment you leave,
                every detail is crafted to ensure an unforgettable
                experience.
              </p>

            </div>

          </GlassPanel>

          {/* SERVICE CARDS */}

          <div
            className="
              grid
              gap-6
              sm:grid-cols-2
              lg:grid-cols-3
              lg:gap-8
            "
          >

            {services.map(
              ({ icon: Icon, title, description, image }) => (
                <article
                  key={title}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-3xl
                    border
                    border-white/15
                    bg-black/20
                    backdrop-blur-xl
                    backdrop-saturate-150
                    shadow-[0_20px_60px_rgba(0,0,0,0.20)]
                    transition-all
                    duration-500
                    hover:-translate-y-2
                    hover:border-amber-500/40
                    hover:bg-black/25
                    hover:shadow-[0_25px_70px_rgba(0,0,0,0.30)]
                  "
                >

                  {/* IMAGE */}

                  <div className="relative h-56 overflow-hidden">

                    <img
                      src={image}
                      alt={title}
                      className="
                        h-full
                        w-full
                        object-cover
                        transition-transform
                        duration-700
                        group-hover:scale-110
                      "
                    />

                    <div
                      className="
                        absolute
                        inset-0
                        bg-gradient-to-t
                        from-black/70
                        via-black/10
                        to-transparent
                      "
                    />

                    {/* ICON */}

                    <div
                      className="
                        absolute
                        bottom-4
                        left-5
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-amber-400/40
                        bg-black/30
                        text-amber-400
                        backdrop-blur-xl
                      "
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                  </div>

                  {/* CONTENT */}

                  <div className="p-6 sm:p-7">

                    <h3
                      className="
                        font-serif
                        text-xl
                        font-medium
                        text-white
                      "
                    >
                      {title}
                    </h3>

                    <p
                      className="
                        mt-3
                        text-sm
                        leading-6
                        text-white/60
                      "
                    >
                      {description}
                    </p>

                  </div>

                </article>
              )
            )}

          </div>

        </div>
      </section>

      {/* =====================================================
          EXPERIENCE SECTION
      ===================================================== */}

      <section
        className="
          relative
          overflow-hidden
          bg-transparent
          px-6
          py-20
          sm:px-10
          lg:px-16
          lg:py-28
        "
      >

        <div className="mx-auto max-w-7xl">

          <div className="relative overflow-hidden rounded-3xl">

            {/* BACKGROUND IMAGE */}

            <img
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=90"
              alt="Hotel interior"
              className="
                absolute
                inset-0
                h-full
                w-full
                object-cover
                transition-transform
                duration-[1200ms]
                hover:scale-105
              "
            />

            <div
              className="
                absolute
                inset-0
                bg-black/45
                backdrop-blur-[1px]
              "
            />

            {/* CONTENT */}

            <div
              className="
                relative
                z-10
                grid
                min-h-[600px]
                items-center
                lg:grid-cols-2
              "
            >

              <GlassPanel
                className="
                  m-6
                  p-7
                  sm:m-10
                  sm:p-10
                  lg:m-14
                  lg:p-12
                "
              >

                <p
                  className="
                    mb-5
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.2em]
                    text-amber-400
                  "
                >
                  The ComfyStay difference
                </p>

                <h2
                  className="
                    font-serif
                    text-4xl
                    leading-tight
                    tracking-[-0.025em]
                    text-white
                    sm:text-5xl
                  "
                >
                  Hospitality that feels personal.
                </h2>

                <p
                  className="
                    mt-6
                    max-w-lg
                    text-base
                    leading-8
                    text-white/75
                  "
                >
                  We believe the best hospitality is felt, not announced.
                  It is the calm of arriving somewhere beautiful, the ease
                  of knowing what you need is close at hand, and the freedom
                  to make the day entirely your own.
                </p>

                <div className="mt-8 space-y-5">

                  {[
                    "Personally curated experiences for every guest",
                    "Locally sourced ingredients in every meal",
                    "Sustainable practices woven into every detail",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3"
                    >

                      <div
                        className="
                          mt-1
                          flex
                          h-5
                          w-5
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-amber-500/20
                          text-amber-400
                        "
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>

                      <p className="text-sm leading-6 text-white/70">
                        {item}
                      </p>

                    </div>
                  ))}

                </div>

              </GlassPanel>

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section
        className="
          relative
          bg-transparent
          px-6
          py-20
          sm:px-10
          lg:px-16
          lg:py-28
        "
      >

        <div className="mx-auto max-w-4xl">

          <GlassPanel
            className="
              p-8
              text-center
              sm:p-12
              lg:p-16
            "
          >

            <p
              className="
                mb-5
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.2em]
                text-amber-400
              "
            >
              Ready to experience luxury?
            </p>

            <h2
              className="
                mx-auto
                max-w-2xl
                font-serif
                text-4xl
                leading-tight
                tracking-[-0.025em]
                text-white
                sm:text-5xl
              "
            >
              Your perfect stay is just a click away.
            </h2>

            <p
              className="
                mx-auto
                mt-5
                max-w-lg
                text-sm
                leading-7
                text-white/60
              "
            >
              Browse our collection of rooms and suites, or reach out
              to our team to plan something truly special.
            </p>

            <div className="mt-10 flex justify-center">

              <button
                type="button"
                onClick={() => navigate("/about")}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-white/15
                  bg-white/5
                  px-8
                  py-4
                  text-sm
                  font-semibold
                  text-white
                  backdrop-blur-md
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:border-amber-500/50
                  hover:bg-white/10
                  hover:text-amber-300
                "
              >
                About ComfyStay

                <FiArrowUpRight className="h-4 w-4" />
              </button>

            </div>

          </GlassPanel>

        </div>

      </section>

    </div>
  );
};

export default Services;