import React from "react";
import { FiArrowUpRight, FiStar } from "react-icons/fi";

/* =========================================================
   TESTIMONIAL DATA
========================================================= */

const testimonials = [
  {
    name: "Sophia Laurent",
    location: "Paris, France",
    text: "An absolutely stunning experience. Every detail was thoughtfully considered and the staff made us feel completely at home.",
    avatar: "S",
  },
  {
    name: "James Mitchell",
    location: "New York, USA",
    text: "ComfyStay exceeded every expectation. The luxurious suite and impeccable service made this one of our best stays.",
    avatar: "J",
  },
  {
    name: "Aiko Tanaka",
    location: "Tokyo, Japan",
    text: "A perfect blend of modern luxury and warm hospitality. The entire experience felt effortless from beginning to end.",
    avatar: "A",
  },
  {
    name: "Daniel Cooper",
    location: "London, UK",
    text: "Beautiful property, wonderful atmosphere and genuinely thoughtful service. I would happily stay here again.",
    avatar: "D",
  },
  {
    name: "Emma Wilson",
    location: "Sydney, Australia",
    text: "The room was gorgeous and incredibly peaceful. Everything felt carefully designed around comfort and relaxation.",
    avatar: "E",
  },
  {
    name: "Lucas Martin",
    location: "Barcelona, Spain",
    text: "From check-in to check-out, everything was smooth. The attention to detail was exceptional.",
    avatar: "L",
  },
  {
    name: "Olivia Bennett",
    location: "Toronto, Canada",
    text: "One of those rare hotels where the photographs actually undersell how beautiful the place feels in person.",
    avatar: "O",
  },
  {
    name: "Noah Anderson",
    location: "Los Angeles, USA",
    text: "The perfect combination of privacy, comfort and excellent hospitality. I didn't want to leave.",
    avatar: "N",
  },
  {
    name: "Mia Rossi",
    location: "Milan, Italy",
    text: "Everything was elegant without feeling excessive. The atmosphere was warm, calm and incredibly inviting.",
    avatar: "M",
  },
  {
    name: "Ethan Clarke",
    location: "Dubai, UAE",
    text: "An unforgettable stay. The service was personal, the rooms were beautiful and every moment felt special.",
    avatar: "E",
  },
  {
    name: "Charlotte Evans",
    location: "Amsterdam, Netherlands",
    text: "A beautifully designed stay with exceptional service. Everything felt effortless and personal.",
    avatar: "C",
  },
  {
    name: "Michael Brown",
    location: "Singapore",
    text: "The atmosphere was peaceful, elegant and welcoming. It felt like a genuine escape from everyday life.",
    avatar: "M",
  },
];

/* =========================================================
   COLUMN DATA
========================================================= */

const columnOne = [
  testimonials[0],
  testimonials[3],
  testimonials[6],
  testimonials[9],
];

const columnTwo = [
  testimonials[1],
  testimonials[4],
  testimonials[7],
  testimonials[10],
];

const columnThree = [
  testimonials[2],
  testimonials[5],
  testimonials[8],
  testimonials[11],
];

/* =========================================================
   CARD
========================================================= */

const TestimonialCard = ({ testimonial }) => {
  return (
    <article
      className="
        group
        relative
        w-full
        shrink-0
        overflow-hidden
        rounded-[20px]
        border
        border-white/[0.13]
        bg-white/[0.055]
        p-5
        shadow-[0_15px_45px_rgba(0,0,0,0.18)]
        backdrop-blur-2xl
        transition-all
        duration-500
        hover:border-amber-400/25
        hover:bg-white/[0.08]
      "
    >
      {/* Glow */}

      <div
        className="
          pointer-events-none
          absolute
          -right-12
          -top-12
          h-24
          w-24
          rounded-full
          bg-amber-400/[0.06]
          blur-3xl
        "
      />

      {/* Stars */}

      <div className="relative flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className="
              h-3
              w-3
              fill-amber-400
              text-amber-400
            "
          />
        ))}
      </div>

      {/* Text */}

      <p
        className="
          relative
          mt-4
          text-[11px]
          leading-5
          text-stone-300
        "
      >
        "{testimonial.text}"
      </p>

      {/* Divider */}

      <div
        className="
          my-4
          h-px
          w-full
          bg-white/[0.08]
        "
      />

      {/* User */}

      <div className="relative flex items-center gap-2.5">
        <div
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-gradient-to-br
            from-amber-500
            to-amber-700
            text-[10px]
            font-bold
            text-white
          "
        >
          {testimonial.avatar}
        </div>

        <div className="min-w-0">
          <p
            className="
              truncate
              text-[11px]
              font-semibold
              text-white
            "
          >
            {testimonial.name}
          </p>

          <p
            className="
              truncate
              text-[9px]
              text-stone-500
            "
          >
            {testimonial.location}
          </p>
        </div>

        <div
          className="
            ml-auto
            flex
            h-6
            w-6
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            border-white/10
            text-white/40
          "
        >
          <FiArrowUpRight className="h-2.5 w-2.5" />
        </div>
      </div>
    </article>
  );
};

/* =========================================================
   COLUMN
========================================================= */

const TestimonialColumn = ({
  cards,
  direction,
  duration,
}) => {
  const items = [...cards, ...cards];

  return (
    <div
      className="
        relative
        h-[520px]
        overflow-hidden
      "
    >
      {/* Top fade */}

      <div
        className="
          pointer-events-none
          absolute
          left-0
          right-0
          top-0
          z-20
          h-14
          bg-gradient-to-b
          from-[#0c0a09]
          to-transparent
        "
      />

      {/* Bottom fade */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-0
          right-0
          z-20
          h-14
          bg-gradient-to-t
          from-[#0c0a09]
          to-transparent
        "
      />

      {/* Animation */}

      <div
        className={`
          flex
          flex-col
          gap-4
          ${
            direction === "up"
              ? "testimonial-up"
              : "testimonial-down"
          }
        `}
        style={{
          animationDuration: `${duration}s`,
        }}
      >
        {items.map((testimonial, index) => (
          <TestimonialCard
            key={`${testimonial.name}-${index}`}
            testimonial={testimonial}
          />
        ))}
      </div>
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const TestimonialUi = () => {
  return (
    <>
      {/* ===================================================
          ANIMATION
      =================================================== */}

      <style>
        {`
          @keyframes testimonialUp {
            from {
              transform: translateY(0);
            }

            to {
              transform: translateY(-50%);
            }
          }

          @keyframes testimonialDown {
            from {
              transform: translateY(-50%);
            }

            to {
              transform: translateY(0);
            }
          }

          .testimonial-up {
            animation-name: testimonialUp;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }

          .testimonial-down {
            animation-name: testimonialDown;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .testimonial-up,
            .testimonial-down {
              animation-play-state: paused;
            }
          }
        `}
      </style>

      {/* ===================================================
          SECTION
      =================================================== */}

      <section
        className="
          relative
          overflow-hidden
          bg-transparent
          py-16
          sm:py-20
          lg:py-24
        "
      >
        {/* =================================================
            AMBIENT LIGHT
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
          "
        >
          <div
            className="
              absolute
              left-[5%]
              top-[10%]
              h-[350px]
              w-[350px]
              rounded-full
              bg-amber-500/[0.035]
              blur-[140px]
            "
          />

          <div
            className="
              absolute
              right-[5%]
              top-[25%]
              h-[400px]
              w-[400px]
              rounded-full
              bg-amber-700/[0.025]
              blur-[150px]
            "
          />
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div
          className="
            relative
            z-10
            mx-auto
            max-w-7xl
            px-5
            sm:px-8
            lg:px-12
          "
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className="
              mx-auto
              mb-10
              max-w-2xl
              text-center
            "
          >
            <p
              className="
                mb-3
                flex
                items-center
                justify-center
                gap-3
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.22em]
                text-amber-400
              "
            >
              <span className="h-px w-8 bg-amber-500/40" />

              Guest Stories

              <span className="h-px w-8 bg-amber-500/40" />
            </p>

            <h2
              className="
                font-serif
                text-3xl
                leading-tight
                tracking-[-0.03em]
                text-white
                sm:text-4xl
                lg:text-5xl
              "
            >
              Loved by those who{" "}
              <span className="italic text-white/55">
                stay with us.
              </span>
            </h2>
          </div>

          {/* =================================================
              THREE COLUMNS
          ================================================= */}

          <div
            className="
              grid
              grid-cols-3
              gap-3
              sm:gap-5
              lg:gap-6
            "
          >
            {/* COLUMN 1
                BOTTOM → TOP
            */}

            <TestimonialColumn
              cards={columnOne}
              direction="up"
              duration={24}
            />

            {/* COLUMN 2
                TOP → BOTTOM
            */}

            <TestimonialColumn
              cards={columnTwo}
              direction="down"
              duration={28}
            />

            {/* COLUMN 3
                BOTTOM → TOP
            */}

            <TestimonialColumn
              cards={columnThree}
              direction="up"
              duration={25}
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default TestimonialUi;