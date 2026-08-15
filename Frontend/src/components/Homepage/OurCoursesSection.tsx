import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseCard } from "@/components/course/CourseCard";

export default function OurCoursesSection({ featured }: { featured: any[] }) {
  if (!featured || featured.length === 0) return null;

  return (
    <section className="relative w-full bg-[url('/homepage/HomeHero2.png')] bg-fixed bg-cover bg-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      {/* Full width frosted glass overlay for parallax */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="reveal relative mx-auto max-w-6xl px-4 py-10 lg:py-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-extrabold text-amber-500 drop-shadow-sm sm:text-3xl">
              Our courses
            </h2>

            <p className="mt-2 text-sm text-white/90 sm:text-base">
              Popular courses picked for you.
            </p>
          </div>

          <Link
            href="/catalog"
            className="flex items-center justify-center gap-1 text-sm font-semibold text-teal-400 sm:justify-start hover:text-teal-300 transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 sm:mt-8 lg:grid-cols-4">
          {featured.map((c) => (
            <CourseCard key={c._id} course={c} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/catalog"
            className="group flex items-center justify-center gap-2 rounded-full bg-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-teal-400 hover:shadow-teal-500/25 sm:text-base"
          >
            Find all courses
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
