import Image from "next/image";
import Link from "next/link";
import { Users, Lock, Layers } from "lucide-react";
import type { CourseCardData } from "@/types/api";
import { cn } from "@/lib/utils";
import { formatKES } from "@/lib/currency";

function LevelBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sun-100 px-2 py-0.5 text-[11px] font-bold text-sun-700">
      <Layers className="h-3 w-3" /> {label}
    </span>
  );
}

export function CourseCard({
  course,
  locked = false,
  levelLabel,
  lockHint,
}: {
  course: CourseCardData;
  locked?: boolean;
  /** Display name of the course's level (omit/empty for entry level — no badge). */
  levelLabel?: string;
  /** Tooltip / overlay text shown when locked, e.g. "Reach Level 1 to unlock". */
  lockHint?: string;
}) {
  const hint = lockHint ?? "Locked";

  const inner = (
    <>
      <div className="relative aspect-video w-full bg-ink-100">
        {course.thumbnail?.url ? (
          <Image
            src={course.thumbnail.url}
            alt={course.courseName}
            fill
            unoptimized
            sizes="(max-width:768px) 100vw, 33vw"
            className={cn("object-cover transition", locked ? "opacity-60" : "group-hover:scale-[1.02]")}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image src="/brand/ball.png" alt="" width={48} height={48} className="opacity-40" />
          </div>
        )}
        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink-900/50 px-3 text-center text-white">
            <Lock className="h-6 w-6" />
            <span className="text-xs font-semibold">{hint}</span>
          </div>
        )}
        <span className="absolute left-2 top-2 flex gap-1">
          {levelLabel && <LevelBadge label={levelLabel} />}
          {course.courseType === "miscellaneous" && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700">Special</span>
          )}
        </span>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-ink-900">{course.courseName}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-500">{course.courseDescription}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-pitch-700">{formatKES(course.price)}</span>
          <span className="flex items-center gap-3 text-xs text-ink-400">
            {(course.points ?? 0) > 0 && <span className="font-semibold text-brand-600">+{course.points} pts</span>}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {course.studentsEnrolledCount ?? 0}
            </span>
          </span>
        </div>
      </div>
    </>
  );

  if (locked) {
    return (
      <div className="card group cursor-not-allowed overflow-hidden" title={hint}>
        {inner}
      </div>
    );
  }

  return (
    <Link href={`/courses/${course.slug}`} className="card group overflow-hidden transition hover:shadow-md">
      {inner}
    </Link>
  );
}
