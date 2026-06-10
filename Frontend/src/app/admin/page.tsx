"use client";

import Link from "next/link";
import { BookOpen, Users, MessageSquare, ClipboardList, CheckCircle2, GraduationCap } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminDashboard } from "@/hooks/useAdmin";
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
        </>
      )}
    </AdminShell>
  );
}
