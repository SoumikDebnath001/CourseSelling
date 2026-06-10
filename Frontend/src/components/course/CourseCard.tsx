import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import type { CourseCardData } from "@/types/api";

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link href={`/courses/${course.slug}`} className="card group overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-video w-full bg-ink-100">
        {course.thumbnail?.url ? (
          <Image
            src={course.thumbnail.url}
            alt={course.courseName}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image src="/brand/ball.png" alt="" width={48} height={48} className="opacity-40" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-ink-900">{course.courseName}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-500">{course.courseDescription}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-pitch-700">
            {course.price > 0 ? `₹${course.price}` : "Free"}
          </span>
          <span className="flex items-center gap-1 text-xs text-ink-400">
            <Users className="h-3.5 w-3.5" /> {course.studentsEnrolledCount ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
