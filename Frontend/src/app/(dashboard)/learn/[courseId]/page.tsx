"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Clock, Award, ListChecks, ShieldCheck } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useFullCourse, useCompleteTopic } from "@/hooks/useLearn";
import { useAuth } from "@/store/auth";
import { LearnTopbar } from "@/components/layout/LearnTopbar";
import { CourseCurriculum } from "@/components/learn/CourseCurriculum";
import { PhysicalAssessmentModal } from "@/components/learn/PhysicalAssessmentModal";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { TestRunner } from "@/components/test/TestRunner";
import { FullScreenSpinner } from "@/components/ui/Spinner";
import { generateCertificate } from "@/lib/certificate";
import { cn } from "@/lib/utils";
import type { Topic } from "@/types/api";

function fmtLength(totalSec: number): string {
  if (!totalSec) return "—";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h ? `${h}h ` : ""}${m}m ${s}s`;
}

function LearnInner({ courseId }: { courseId: string }) {
  const { data, isLoading } = useFullCourse(courseId);
  const complete = useCompleteTopic(courseId);
  const account = useAuth((s) => s.account);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [physModal, setPhysModal] = useState<{ scope: "course" | "section"; level?: string; title: string } | null>(null);

  const allTopics = useMemo<Topic[]>(
    () => data?.course.modules.flatMap((m) => m.topics) ?? [],
    [data]
  );
  const activeTopic = allTopics.find((t) => t._id === activeTopicId) ?? allTopics[0];
  const completedSet = new Set(data?.progress.completedTopics ?? []);
  const passedSet = new Set(data?.progress.passedTests ?? []);

  if (isLoading) return <FullScreenSpinner />;
  if (!data?.course) return <p className="p-10 text-center text-ink-400">Course not found or not enrolled.</p>;

  const { course, sectionStatus, certificateLevels, physicalAssessments } = data;
  const isSectioned = course.courseType === "progressive" && sectionStatus.length > 0;
  const totalTopics = allTopics.length;
  const completedCount = allTopics.filter((t) => completedSet.has(t._id)).length;
  const percent = totalTopics ? Math.round((completedCount / totalTopics) * 100) : 0;
  const totalLengthSec = allTopics.reduce((sum, t) => sum + (t.timeDurationSec ?? 0), 0);

  // For miscellaneous courses the single certificate is earned once the server has issued it
  // (server gates on all topics done + final test passed + physical assessment when required).
  const courseCertEarned = certificateLevels.includes(course.level);
  const courseApplication = physicalAssessments.find((p) => p.scope === "course");
  const needsCoursePhysical = !!course.requiresPhysicalAssessment && !courseApplication;
  const earnedCertCount = sectionStatus.filter((s) => s.certificateEarned).length;

  // Generate a certificate for a given level (label appended for progressive sections).
  const getCertificate = (label?: string) =>
    generateCertificate({
      studentName: account?.name ?? "Student",
      courseName: label ? `${course.courseName} — ${label}` : course.courseName,
      color: course.certificateColor,
    });

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <LearnTopbar />

      {/* Course header bar */}
      <div className="bg-gradient-to-r from-brand-600 to-grape-600 text-white">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold hover:opacity-90">
            <ChevronLeft className="h-5 w-5" />
            {course.courseName}
          </Link>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex shrink-0 items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5">
              <Clock className="h-4 w-4" />
              <div className="leading-tight">
                <div className="text-sm font-bold">{fmtLength(totalLengthSec)}</div>
                <div className="text-[10px] uppercase tracking-wide opacity-80">Total length</div>
              </div>
            </div>

            <div className="min-w-[140px] flex-1 sm:min-w-[160px] sm:flex-initial">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="opacity-90">Course Progress</span>
                <span className="font-bold">{percent}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>

            {isSectioned ? (
              <button
                onClick={() => setSidebarOpen(true)}
                title="Your level certificates are in the course content panel"
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition",
                  earnedCertCount > 0 ? "cert-glow bg-sun-400 text-ink-900 hover:bg-sun-300" : "bg-white/15 text-white/80 hover:bg-white/25"
                )}
              >
                <Award className="h-4 w-4" /> {earnedCertCount}/{sectionStatus.length} Certificates
              </button>
            ) : needsCoursePhysical ? (
              <button
                onClick={() => setPhysModal({ scope: "course", title: course.courseName })}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-pitch-700 transition hover:bg-white/90"
              >
                <ShieldCheck className="h-4 w-4" /> Physical assessment
              </button>
            ) : (
              <button
                onClick={() => getCertificate()}
                disabled={!courseCertEarned}
                title={courseCertEarned ? "Download your certificate" : "Complete the course to unlock your certificate"}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition",
                  courseCertEarned
                    ? "cert-glow bg-sun-400 text-ink-900 hover:bg-sun-300"
                    : "cursor-not-allowed bg-white/15 text-white/60"
                )}
              >
                <Award className="h-4 w-4" /> Certificate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: bar to open the curriculum drawer */}
      <div className="flex items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
        <span className="min-w-0 truncate text-sm font-medium text-ink-600">
          {completedCount} / {totalTopics} lectures · {percent}% complete
        </span>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <ListChecks className="h-4 w-4" /> Course content
        </button>
      </div>

      {/* Body: player + curriculum */}
      <div className="grid flex-1 lg:grid-cols-[1fr_400px]">
        <main className="min-w-0 lg:h-[calc(100vh-9rem)] lg:overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {activeTopic ? (
              <>
                <VideoPlayer
                  topic={activeTopic}
                  completed={completedSet.has(activeTopic._id)}
                  completing={complete.isPending}
                  onComplete={() => complete.mutate(activeTopic._id)}
                />
                <CommentsSection topicId={activeTopic._id} />
              </>
            ) : (
              <p className="py-20 text-center text-ink-400">This course has no topics yet.</p>
            )}
          </div>
        </main>

        {/* Mobile drawer overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />
        )}

        <aside
          className={cn(
            "bg-white",
            // Mobile: slide-in drawer from the right
            "fixed inset-y-0 right-0 z-50 w-[86vw] max-w-sm shadow-2xl transition-transform duration-300 ease-out",
            sidebarOpen ? "translate-x-0" : "translate-x-full",
            // Desktop: static sidebar column
            "lg:static lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0 lg:shadow-none lg:transition-none",
            "lg:h-[calc(100vh-9rem)] lg:border-l lg:border-ink-200"
          )}
        >
          <CourseCurriculum
            course={course}
            activeTopicId={activeTopic?._id}
            completedSet={completedSet}
            passedSet={passedSet}
            onSelectTopic={(id) => { setActiveTopicId(id); setSidebarOpen(false); }}
            onSelectTest={(id) => { setActiveTest(id); setSidebarOpen(false); }}
            onMarkTopicDone={(id) => complete.mutate(id)}
            onClose={() => setSidebarOpen(false)}
            sections={isSectioned ? sectionStatus : undefined}
            onApplyPhysical={(level, title) => { setPhysModal({ scope: "section", level, title }); setSidebarOpen(false); }}
            onGetCertificate={(_level, label) => getCertificate(label)}
          />
        </aside>
      </div>

      {activeTest && <TestRunner testId={activeTest} onClose={() => setActiveTest(null)} />}
      {physModal && (
        <PhysicalAssessmentModal
          courseId={courseId}
          scope={physModal.scope}
          level={physModal.level}
          title={physModal.title}
          onClose={() => setPhysModal(null)}
        />
      )}
    </div>
  );
}

export default function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  return (
    <RequireAuth>
      <LearnInner courseId={courseId} />
    </RequireAuth>
  );
}
