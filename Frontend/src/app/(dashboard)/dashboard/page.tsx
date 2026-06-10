"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardSidebar, type DashView } from "@/components/dashboard/DashboardSidebar";
import { useMyEnrolledCourses } from "@/hooks/useLearn";
import { Spinner } from "@/components/ui/Spinner";
import type { EnrolledCourse } from "@/types/api";

function DashboardInner() {
  const { data: courses, isLoading } = useMyEnrolledCourses();
  const [view, setView] = useState<DashView>("my");

  const completed = (courses ?? []).filter((c) => c.percent >= 100);
  const inProgress = (courses ?? []).filter((c) => c.percent < 100);
  const shown = view === "completed" ? completed : inProgress;

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <DashboardSidebar view={view} setView={setView} />

        <main className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-ink-900">
            {view === "completed" ? "Completed courses" : "My courses"}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {view === "completed" ? "Courses you've finished — well played." : "Keep going where you left off."}
          </p>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
          ) : shown.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {shown.map((c) => <DashCourseCard key={c.course._id} data={c} />)}
            </div>
          ) : (
            <div className="card mt-5 p-10 text-center">
              {view === "completed" ? (
                <>
                  <CheckCircle2 className="mx-auto h-8 w-8 text-ink-300" />
                  <p className="mt-2 text-ink-500">No completed courses yet — finish one to see it here.</p>
                </>
              ) : (
                <>
                  <BookOpen className="mx-auto h-8 w-8 text-ink-300" />
                  <p className="mt-2 text-ink-500">You haven&apos;t enrolled in any courses yet.</p>
                  <Link href="/catalog" className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-brand-600 to-grape-600 px-4 py-2 text-sm font-semibold text-white">
                    Explore courses
                  </Link>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function DashCourseCard({ data }: { data: EnrolledCourse }) {
  const { course, percent, completedTopics, totalTopics } = data;
  return (
    <Link href={`/learn/${course._id}`} className="card overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-video bg-ink-100">
        {course.thumbnail?.url ? (
          <Image src={course.thumbnail.url} alt={course.courseName} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image src="/brand/ball.png" alt="" width={40} height={40} className="opacity-40" />
          </div>
        )}
        {percent >= 100 && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-pitch-600 px-2 py-0.5 text-xs font-semibold text-white">
            <CheckCircle2 className="h-3.5 w-3.5" /> Done
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-ink-900">{course.courseName}</h3>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full bg-gradient-to-r from-brand-500 to-grape-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-ink-400">
          <span>{completedTopics}/{totalTopics} topics</span>
          <span className="flex items-center gap-1 font-semibold text-brand-700">
            {percent >= 100 ? "Review" : "Continue"} <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth kind="user">
      <DashboardInner />
    </RequireAuth>
  );
}
