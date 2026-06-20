"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Trash2, Pencil } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminCourses, useDeleteCourse } from "@/hooks/useAdmin";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

export default function AdminCoursesPage() {
  const { data: courses, isLoading } = useAdminCourses();
  const del = useDeleteCourse();

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Courses</h1>
        <Link href="/admin/courses/new" className="btn-primary"><Plus className="h-4 w-4" /> New course</Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
      ) : courses && courses.length > 0 ? (
        <div className="mt-5 space-y-3">
          {courses.map((c) => (
            <div key={c._id} className="card flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:gap-4">
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                {c.thumbnail?.url ? (
                  <Image src={c.thumbnail.url} alt={c.courseName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image src="/brand/ball.png" alt="" width={24} height={24} className="opacity-40" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-ink-900">{c.courseName}</h3>
                <p className="text-xs text-ink-400">{c.modules?.length ?? 0} modules · {c.studentsEnrolledCount ?? 0} enrolled</p>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", c.status === "Published" ? "bg-pitch-100 text-pitch-700" : "bg-ink-100 text-ink-500")}>
                  {c.status}
                </span>
                <Link href={`/admin/courses/${c._id}`} className="btn-ghost ml-auto px-3 py-1.5 text-xs sm:ml-0"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                <button
                  onClick={() => { if (confirm(`Delete "${c.courseName}"? This removes its videos and content.`)) del.mutate(c._id); }}
                  className="rounded-lg p-2 text-ink-400 hover:bg-ball-50 hover:text-ball-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card mt-5 p-10 text-center">
          <p className="text-ink-500">No courses yet.</p>
          <Link href="/admin/courses/new" className="btn-primary mt-4 inline-flex">Create your first course</Link>
        </div>
      )}
    </AdminShell>
  );
}
