"use client";

import { useState } from "react";
import { Search, BadgeCheck, Globe, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  useStudents,
  useStudentProgression,
  useSetStudentLevel,
  useAdjustStudentPoints,
  useGrantCourseAccess,
  useRevokeCourseAccess,
  useAdminCourses,
  type AdminStudent,
} from "@/hooks/useAdmin";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

export default function AdminStudentsPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: students, isLoading } = useStudents(search);

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-ink-900">Users</h1>
      <p className="mt-1 text-sm text-ink-400">
        Academy members and online learners. Expand a user to promote/demote their level per category, adjust points, or grant direct course access. All overrides are logged.
      </p>

      <div className="relative mt-5 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input className="input pl-9" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card mt-5 overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : students && students.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase text-ink-400">
              <tr>
                <th className="px-4 py-2" />
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Enrolled</th>
                <th className="px-4 py-2">Certs</th>
                <th className="px-4 py-2">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {students.map((s) => (
                <StudentRow
                  key={s._id}
                  s={s}
                  expanded={expanded === s._id}
                  onToggle={() => setExpanded((e) => (e === s._id ? null : s._id))}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-ink-400">No users found.</p>
        )}
      </div>
    </AdminShell>
  );
}

function StudentRow({ s, expanded, onToggle }: { s: AdminStudent; expanded: boolean; onToggle: () => void }) {
  const isMember = s.source === "member";
  return (
    <>
      <tr className="cursor-pointer hover:bg-ink-50/60" onClick={onToggle}>
        <td className="px-4 py-2 text-ink-400">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
        <td className="px-4 py-2 font-medium text-ink-800">{s.name}</td>
        <td className="px-4 py-2 text-ink-500">{s.email}</td>
        <td className="px-4 py-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", isMember ? "bg-pitch-100 text-pitch-700" : "bg-brand-100 text-brand-700")}>
            {isMember ? <BadgeCheck className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
            {isMember ? "Member" : "Online"}
          </span>
        </td>
        <td className="px-4 py-2 text-ink-600">{s.enrolledCount}</td>
        <td className="px-4 py-2 text-ink-600">{s.certificates}</td>
        <td className="px-4 py-2 font-semibold text-ink-800">{s.totalPoints}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-ink-50/50 px-4 py-4">
            <OverridePanel userId={s._id} />
          </td>
        </tr>
      )}
    </>
  );
}

function OverridePanel({ userId }: { userId: string }) {
  const { data, isLoading } = useStudentProgression(userId);
  const setLevel = useSetStudentLevel();
  const adjust = useAdjustStudentPoints();
  const grant = useGrantCourseAccess();
  const revoke = useRevokeCourseAccess();
  const { data: courses } = useAdminCourses();

  const [newCategory, setNewCategory] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [grantCourse, setGrantCourse] = useState("");

  if (isLoading || !data) return <div className="flex py-4"><Spinner className="h-5 w-5" /></div>;

  const { progression, categories, levels, grants } = data;
  const levelName = (key: string) => {
    const l = levels.find((x) => x.key === key);
    return l?.label || l?.name || key;
  };
  const categoriesWithoutProgress = categories.filter((c) => !progression.some((p) => p.category?._id === c._id));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Per-category progression */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase text-ink-400">Category progression</h3>
        {progression.length === 0 && <p className="text-sm text-ink-400">No category progress yet.</p>}
        {progression.map((p) => (
          <div key={p._id} className="card p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink-800">{p.category?.name ?? "Uncategorised"}</span>
              <span className="text-xs font-semibold text-ink-500">{p.points} pts</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                className="input h-8 w-auto py-0 text-sm"
                value={p.currentLevel}
                disabled={!p.category}
                onChange={(e) => p.category && setLevel.mutate({ userId, category: p.category._id, level: e.target.value })}
              >
                {levels.map((l) => (
                  <option key={l.key} value={l.key}>{l.label || l.name}</option>
                ))}
              </select>
              {p.category && <PointAdjust onApply={(delta) => adjust.mutate({ userId, category: p.category!._id, delta })} />}
            </div>
          </div>
        ))}

        {/* Add progress in a new category */}
        {categoriesWithoutProgress.length > 0 && (
          <div className="card flex flex-wrap items-end gap-2 p-3">
            <div className="flex-1">
              <label className="text-[11px] font-semibold uppercase text-ink-400">Add category</label>
              <select className="input mt-1 h-8 py-0 text-sm" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                <option value="">Select…</option>
                {categoriesWithoutProgress.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <select className="input h-8 w-auto py-0 text-sm" value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
              <option value="">Level…</option>
              {levels.map((l) => (
                <option key={l.key} value={l.key}>{l.name}</option>
              ))}
            </select>
            <button
              disabled={!newCategory || !newLevel}
              onClick={() => {
                setLevel.mutate({ userId, category: newCategory, level: newLevel });
                setNewCategory("");
                setNewLevel("");
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-pitch-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Set
            </button>
          </div>
        )}
      </div>

      {/* Course access grants */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase text-ink-400">Direct course access</h3>
        <div className="card flex flex-wrap items-end gap-2 p-3">
          <div className="flex-1">
            <label className="text-[11px] font-semibold uppercase text-ink-400">Grant a course (bypass locks)</label>
            <select className="input mt-1 h-8 py-0 text-sm" value={grantCourse} onChange={(e) => setGrantCourse(e.target.value)}>
              <option value="">Select course…</option>
              {(courses ?? []).map((c) => (
                <option key={c._id} value={c._id}>{c.courseName}</option>
              ))}
            </select>
          </div>
          <button
            disabled={!grantCourse}
            onClick={() => {
              grant.mutate({ userId, course: grantCourse });
              setGrantCourse("");
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-pitch-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Grant
          </button>
        </div>
        {grants.length > 0 ? (
          <ul className="space-y-2">
            {grants.map((g) => (
              <li key={g._id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-ink-100">
                <span className="text-ink-700">{g.course?.courseName ?? "—"}</span>
                <button
                  onClick={() => g.course && revoke.mutate({ userId, courseId: g.course._id })}
                  className="text-ink-400 hover:text-ball-600"
                  title="Revoke"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-400">No direct grants.</p>
        )}
        <p className="text-[11px] text-ink-400">{levelName(levels[0]?.key ?? "")} courses are open to everyone by default.</p>
      </div>
    </div>
  );
}

function PointAdjust({ onApply }: { onApply: (delta: number) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        className="input h-8 w-20 py-0 text-sm"
        placeholder="±pts"
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <button
        disabled={!val || Number.isNaN(Number(val))}
        onClick={() => {
          onApply(Number(val));
          setVal("");
        }}
        className="rounded-lg border border-ink-200 px-2 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-100 disabled:opacity-40"
      >
        Apply
      </button>
    </div>
  );
}
