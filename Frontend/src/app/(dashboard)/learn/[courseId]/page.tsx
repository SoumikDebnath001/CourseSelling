"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Clock, Award } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useFullCourse, useCompleteTopic } from "@/hooks/useLearn";
import { useAuth } from "@/store/auth";
import { LearnTopbar } from "@/components/layout/LearnTopbar";
import { CourseCurriculum } from "@/components/learn/CourseCurriculum";
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

  const allTopics = useMemo<Topic[]>(
    () => data?.course.modules.flatMap((m) => m.topics) ?? [],
    [data]
  );
  const activeTopic = allTopics.find((t) => t._id === activeTopicId) ?? allTopics[0];
  const completedSet = new Set(data?.progress.completedTopics ?? []);
  const passedSet = new Set(data?.progress.passedTests ?? []);

  if (isLoading) return <FullScreenSpinner />;
  if (!data?.course) return <p className="p-10 text-center text-ink-400">Course not found or not enrolled.</p>;

  const { course } = data;
  const totalTopics = allTopics.length;
  const completedCount = allTopics.filter((t) => completedSet.has(t._id)).length;
  const percent = totalTopics ? Math.round((completedCount / totalTopics) * 100) : 0;
  const totalLengthSec = allTopics.reduce((sum, t) => sum + (t.timeDurationSec ?? 0), 0);

  // Course is "complete" when every topic is done and the final test (if any) is passed.
  const finalTestPassed =
    !course.finalTest?.isPublished || passedSet.has(course.finalTest._id);
  const isComplete = totalTopics > 0 && completedCount === totalTopics && finalTestPassed;

  const getCertificate = () =>
    generateCertificate({
      studentName: account?.name ?? "Student",
      courseName: course.courseName,
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

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5">
              <Clock className="h-4 w-4" />
              <div className="leading-tight">
                <div className="text-sm font-bold">{fmtLength(totalLengthSec)}</div>
                <div className="text-[10px] uppercase tracking-wide opacity-80">Total length</div>
              </div>
            </div>

            <div className="min-w-[160px]">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="opacity-90">Course Progress</span>
                <span className="font-bold">{percent}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>

            <button
              onClick={getCertificate}
              disabled={!isComplete}
              title={isComplete ? "Download your certificate" : "Complete the course to unlock your certificate"}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition",
                isComplete
                  ? "cert-glow bg-sun-400 text-ink-900 hover:bg-sun-300"
                  : "cursor-not-allowed bg-white/15 text-white/60"
              )}
            >
              <Award className="h-4 w-4" /> Certificate
            </button>
          </div>
        </div>
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

        <aside className="border-t border-ink-200 bg-white lg:border-l lg:border-t-0 lg:h-[calc(100vh-9rem)]">
          <CourseCurriculum
            course={course}
            activeTopicId={activeTopic?._id}
            completedSet={completedSet}
            passedSet={passedSet}
            onSelectTopic={(id) => setActiveTopicId(id)}
            onSelectTest={(id) => setActiveTest(id)}
            onMarkTopicDone={(id) => complete.mutate(id)}
          />
        </aside>
      </div>

      {activeTest && <TestRunner testId={activeTest} onClose={() => setActiveTest(null)} />}
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
