"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, Circle, PlayCircle, ClipboardCheck, Trophy } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useFullCourse, useCompleteTopic } from "@/hooks/useLearn";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { TestRunner } from "@/components/test/TestRunner";
import { FullScreenSpinner } from "@/components/ui/Spinner";
import type { Topic } from "@/types/api";
import { cn } from "@/lib/utils";

function LearnInner({ courseId }: { courseId: string }) {
  const { data, isLoading } = useFullCourse(courseId);
  const complete = useCompleteTopic(courseId);
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

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="grid lg:grid-cols-[340px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-ink-200 bg-white lg:h-screen lg:overflow-y-auto">
          <div className="border-b border-ink-200 p-4">
            <Link href="/dashboard" className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </Link>
            <h1 className="mt-2 font-bold text-ink-900">{course.courseName}</h1>
            <div className="mt-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                <div className="h-full bg-pitch-500 transition-all" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-1 text-xs text-ink-400">{completedCount}/{totalTopics} topics · {percent}%</p>
            </div>
          </div>

          <nav className="p-2">
            {course.modules.map((m) => (
              <div key={m._id} className="mb-2">
                <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-ink-400">{m.moduleName}</p>
                {m.topics.map((t) => {
                  const done = completedSet.has(t._id);
                  const active = activeTopic?._id === t._id;
                  return (
                    <button
                      key={t._id}
                      onClick={() => setActiveTopicId(t._id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm",
                        active ? "bg-pitch-50 text-pitch-800" : "text-ink-600 hover:bg-ink-50"
                      )}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-pitch-600" /> : <PlayCircle className="h-4 w-4 shrink-0 text-ink-300" />}
                      <span className="line-clamp-1">{t.title}</span>
                    </button>
                  );
                })}
                {m.test?.isPublished && (
                  <button
                    onClick={() => setActiveTest(m.test!._id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-ball-600 hover:bg-ball-50"
                  >
                    <ClipboardCheck className="h-4 w-4 shrink-0" />
                    Module test {passedSet.has(m.test._id) && <CheckCircle2 className="h-3.5 w-3.5 text-pitch-600" />}
                  </button>
                )}
              </div>
            ))}

            {course.finalTest?.isPublished && (
              <div className="mt-2 border-t border-ink-200 pt-2">
                <button
                  onClick={() => setActiveTest(course.finalTest!._id)}
                  className="flex w-full items-center gap-2 rounded-lg bg-ball-50 px-2 py-2 text-left text-sm font-semibold text-ball-700 hover:bg-ball-100"
                >
                  <Trophy className="h-4 w-4 shrink-0" />
                  Final course test {passedSet.has(course.finalTest._id) && <CheckCircle2 className="h-3.5 w-3.5 text-pitch-600" />}
                </button>
              </div>
            )}
          </nav>
        </aside>

        {/* Main */}
        <main className="lg:h-screen lg:overflow-y-auto">
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
