"use client";

import Link from "next/link";
import { BookOpen, Users, MessageSquare, ClipboardList, CheckCircle2, GraduationCap, Award, TrendingUp, Lock } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminDashboard, useAdminAnalytics } from "@/hooks/useAdmin";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();

  const cards = [
    { label: "Courses", value: data?.stats.courses, icon: BookOpen },
    { label: "Published", value: data?.stats.published, icon: CheckCircle2 },
    { label: "Enrollments", value: data?.stats.enrollments, icon: GraduationCap },
    { label: "Members", value: data?.stats.members, icon: Users },
    { label: "Comments", value: data?.stats.comments, icon: MessageSquare },
    { label: "Tests", value: data?.stats.tests, icon: ClipboardList },
  ];

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {cards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="card p-5">
                <Icon className="h-5 w-5 text-pitch-600" />
                <p className="mt-3 text-2xl font-extrabold text-ink-900">{value ?? 0}</p>
                <p className="text-sm text-ink-400">{label}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-bold text-ink-900">Top courses</h2>
          <div className="card mt-3 divide-y divide-ink-100">
            {data?.topCourses.length ? (
              data.topCourses.map((c) => (
                <Link key={c._id} href={`/admin/courses/${c._id}`} className="flex items-center justify-between px-4 py-3 hover:bg-ink-50">
                  <span className="font-medium text-ink-800">{c.courseName}</span>
                  <span className="text-sm text-ink-400">{c.studentsEnrolledCount} enrolled · {c.status}</span>
                </Link>
              ))
            ) : (
              <p className="px-4 py-6 text-sm text-ink-400">No courses yet.</p>
            )}
          </div>

          <AnalyticsSection />
        </>
      )}
    </AdminShell>
  );
}

function AnalyticsSection() {
  const { data, isLoading } = useAdminAnalytics();
  if (isLoading) return <div className="mt-8 flex justify-center"><Spinner className="h-6 w-6" /></div>;
  if (!data) return null;

  const headline = [
    { label: "Points earned", value: data.totalPointsEarned, icon: TrendingUp },
    { label: "Certificates issued", value: data.certificatesIssued, icon: Award },
    { label: "Advanced learners", value: data.advancedLearners, icon: Users },
    { label: "Entry-level learners", value: data.entryLevelLearners, icon: Lock },
  ];

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-ink-900">Progression analytics</h2>

      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {headline.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4">
            <Icon className="h-5 w-5 text-grape-600" />
            <p className="mt-2 text-2xl font-extrabold text-ink-900">{value}</p>
            <p className="text-xs text-ink-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-ink-700">Users per level</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {data.usersPerLevel.map((l) => (
              <li key={l.level} className="flex items-center justify-between">
                <span className="text-ink-600">{l.name}</span>
                <span className="font-semibold text-ink-900">{l.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-ink-700">Most completed courses</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {data.mostCompletedCourses.length ? (
              data.mostCompletedCourses.map((c) => (
                <li key={c.course} className="flex items-center justify-between gap-2">
                  <span className="truncate text-ink-600">{c.courseName}</span>
                  <span className="font-semibold text-ink-900">{c.completions}</span>
                </li>
              ))
            ) : (
              <li className="text-ink-400">No completions yet.</li>
            )}
          </ul>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-ink-700">Category progression</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {data.categoryProgression.length ? (
              data.categoryProgression.map((c, i) => (
                <li key={c.category ?? i} className="flex items-center justify-between gap-2">
                  <span className="truncate text-ink-600">{c.categoryName}</span>
                  <span className="text-ink-400">{c.learners} learners · {c.points} pts</span>
                </li>
              ))
            ) : (
              <li className="text-ink-400">No data yet.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
