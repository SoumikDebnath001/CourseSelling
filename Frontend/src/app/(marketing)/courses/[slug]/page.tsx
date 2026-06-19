"use client";

import { use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Users, PlayCircle, BookOpen, Lock, Layers } from "lucide-react";
import { useCourseBySlug } from "@/hooks/useCourses";
import { useEnroll } from "@/hooks/useEnroll";
import { useMyProgression } from "@/hooks/useProgression";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/store/auth";
import { courseLocked, levelLabel, isEntryLevel, categoryId } from "@/lib/levels";
import { formatKES } from "@/lib/currency";
import { ModuleAccordion } from "@/components/course/ModuleAccordion";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { data, isLoading } = useCourseBySlug(slug);
  const enroll = useEnroll();
  const { data: progression } = useMyProgression();
  const { settings } = useSettings();
  const account = useAuth((s) => s.account);

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  if (!data?.course) return <p className="py-24 text-center text-ink-400">Course not found.</p>;

  const { course, isEnrolled } = data;
  const topicCount = course.modules.reduce((n, m) => n + m.topics.length, 0);
  const levels = settings.levels;
  const requiredLevel = levelLabel(levels, course.level);
  const hasLevelBadge = levels.length > 0 && !isEntryLevel(levels, course.level);
  // Locked only for signed-in learners below the required level (admins bypass).
  const locked = account?.kind === "user" && courseLocked(progression, course) && !isEnrolled;
  const catId = categoryId(course.category);
  const catProgress = progression?.categories.find((c) => c.category?._id === catId);

  const onEnrollClick = () => {
    if (!account) return router.push("/login");
    if (account.kind === "admin") return router.push(`/admin/courses/${course._id}`);
    enroll.mutate(course._id, { onSuccess: () => router.push(`/learn/${course._id}`) });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: details */}
        <div>
          <h1 className="text-3xl font-extrabold text-ink-900">{course.courseName}</h1>
          <p className="mt-3 text-ink-600">{course.courseDescription}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-500">
            <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {course.modules.length} modules</span>
            <span className="flex items-center gap-1"><PlayCircle className="h-4 w-4" /> {topicCount} lessons</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {course.studentsEnrolledCount} enrolled</span>
            {course.createdByName && <span>By {course.createdByName}</span>}
          </div>

          {course.whatYouWillLearn && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-ink-900">What you&apos;ll learn</h2>
              <p className="mt-2 whitespace-pre-line text-ink-600">{course.whatYouWillLearn}</p>
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-ink-900">Curriculum</h2>
            <ModuleAccordion modules={course.modules} />
          </section>

          {course.instructions?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-ink-900">Requirements</h2>
              <ul className="mt-2 space-y-1">
                {course.instructions.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2 text-ink-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-pitch-600" /> {ins}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right: sticky enroll card */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card overflow-hidden">
            <div className="relative aspect-video bg-ink-100">
              {course.thumbnail?.url ? (
                <Image src={course.thumbnail.url} alt={course.courseName} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Image src="/brand/ball.png" alt="" width={56} height={56} className="opacity-40" />
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-pitch-700">{formatKES(course.price)}</div>
                {hasLevelBadge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sun-100 px-2.5 py-1 text-xs font-bold text-sun-700">
                    <Layers className="h-3.5 w-3.5" /> {requiredLevel}
                  </span>
                )}
              </div>
              {(course.points ?? 0) > 0 && (
                <p className="mt-1 text-sm font-semibold text-brand-600">Earn +{course.points} points on completion</p>
              )}
              {locked ? (
                <div className="mt-4 rounded-xl border border-sun-200 bg-sun-50 p-4 text-center">
                  <Lock className="mx-auto h-6 w-6 text-sun-600" />
                  <p className="mt-2 text-sm font-bold text-ink-900">Locked — {requiredLevel} required</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {catProgress
                      ? `You're at ${catProgress.currentLevelName} in this category${
                          catProgress.nextLevel
                            ? ` — earn ${catProgress.pointsToNext} more point${catProgress.pointsToNext === 1 ? "" : "s"} and complete a ${catProgress.currentLevelName} course to advance.`
                            : "."
                        }`
                      : "Complete previous levels and earn the required points to unlock this course."}
                  </p>
                </div>
              ) : isEnrolled ? (
                <Button className="mt-4 w-full py-2.5" onClick={() => router.push(`/learn/${course._id}`)}>
                  Go to course
                </Button>
              ) : (
                <Button className="mt-4 w-full py-2.5" loading={enroll.isPending} onClick={onEnrollClick}>
                  {account?.kind === "admin" ? "Manage course" : "Enrol now"}
                </Button>
              )}
              <p className="mt-3 text-center text-xs text-ink-400">Lifetime access · {topicCount} lessons</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
