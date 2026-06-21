"use client";

import { useState } from "react";
import { Search, BadgeCheck, Globe, ChevronDown, ChevronRight, Plus, X, Pencil, Ban, RotateCcw, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  useStudents,
  useStudentProgression,
  useSetStudentLevel,
  useAdjustStudentPoints,
  useGrantCourseAccess,
  useRevokeCourseAccess,
  useAdminCourses,
  useUpdateStudent,
  useSetStudentStatus,
  useDeleteStudent,
  type AdminStudent,
} from "@/hooks/useAdmin";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function AdminStudentsPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminStudent | null>(null);
  const [deleting, setDeleting] = useState<AdminStudent | null>(null);
  const { data: students, isLoading } = useStudents(search);

  const toggle = (id: string) => setExpanded((e) => (e === id ? null : id));

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-ink-900">Users</h1>
      <p className="mt-1 text-sm text-ink-400">
        Academy members and online learners. Expand a user to promote/demote their level per category, adjust points, or grant direct course access. Online users can be edited, suspended or deleted. All overrides are logged.
      </p>

      <div className="relative mt-5 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input className="input pl-9" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="card mt-5 flex justify-center py-10"><Spinner /></div>
      ) : students && students.length > 0 ? (
        <>
          {/* Desktop / tablet: table */}
          <div className="card mt-5 hidden overflow-x-auto sm:block">
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
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {students.map((s) => (
                  <StudentRow
                    key={s._id}
                    s={s}
                    expanded={expanded === s._id}
                    onToggle={() => toggle(s._id)}
                    onEdit={() => setEditing(s)}
                    onDelete={() => setDeleting(s)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="mt-5 space-y-3 sm:hidden">
            {students.map((s) => (
              <StudentCard
                key={s._id}
                s={s}
                expanded={expanded === s._id}
                onToggle={() => toggle(s._id)}
                onEdit={() => setEditing(s)}
                onDelete={() => setDeleting(s)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="card mt-5"><p className="px-4 py-8 text-center text-sm text-ink-400">No users found.</p></div>
      )}

      {editing && <EditUserModal s={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteUserModal s={deleting} onClose={() => setDeleting(null)} />}
    </AdminShell>
  );
}

function TypeBadge({ isMember }: { isMember: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", isMember ? "bg-pitch-100 text-pitch-700" : "bg-brand-100 text-brand-700")}>
      {isMember ? <BadgeCheck className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
      {isMember ? "Member" : "Online"}
    </span>
  );
}

/** Edit / suspend / delete controls — only available for this app's own online users. */
function UserActions({ s, onEdit, onDelete, className }: { s: AdminStudent; onEdit: () => void; onDelete: () => void; className?: string }) {
  const setStatus = useSetStudentStatus();
  if (s.source !== "platform") {
    return <span className={cn("text-xs text-ink-300", className)}>Read-only</span>;
  }
  return (
    <div className={cn("flex items-center gap-1", className)} onClick={(e) => e.stopPropagation()}>
      <button onClick={onEdit} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => setStatus.mutate({ userId: s._id, suspended: !s.isSuspended })}
        disabled={setStatus.isPending}
        title={s.isSuspended ? "Reactivate" : "Suspend"}
        className={cn("grid h-8 w-8 place-items-center rounded-lg hover:bg-ink-100", s.isSuspended ? "text-pitch-600" : "text-amber-600")}
      >
        {s.isSuspended ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
      </button>
      <button onClick={onDelete} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-600">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

type RowProps = { s: AdminStudent; expanded: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void };

function StudentRow({ s, expanded, onToggle, onEdit, onDelete }: RowProps) {
  const isMember = s.source === "member";
  return (
    <>
      <tr className="cursor-pointer hover:bg-ink-50/60" onClick={onToggle}>
        <td className="px-4 py-2 text-ink-400">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
        <td className="px-4 py-2 font-medium text-ink-800">
          {s.name}
          {s.isSuspended && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">Suspended</span>}
        </td>
        <td className="px-4 py-2 text-ink-500">{s.email}</td>
        <td className="px-4 py-2"><TypeBadge isMember={isMember} /></td>
        <td className="px-4 py-2 text-ink-600">{s.enrolledCount}</td>
        <td className="px-4 py-2 text-ink-600">{s.certificates}</td>
        <td className="px-4 py-2 font-semibold text-ink-800">{s.totalPoints}</td>
        <td className="px-4 py-2">
          <UserActions s={s} onEdit={onEdit} onDelete={onDelete} className="justify-end" />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-ink-50/50 px-4 py-4">
            <OverridePanel userId={s._id} />
          </td>
        </tr>
      )}
    </>
  );
}

function StudentCard({ s, expanded, onToggle, onEdit, onDelete }: RowProps) {
  const isMember = s.source === "member";
  return (
    <div className="card overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-start gap-2 p-4 text-left">
        <span className="mt-0.5 text-ink-400">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink-800">{s.name}</span>
            <TypeBadge isMember={isMember} />
            {s.isSuspended && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">Suspended</span>}
          </div>
          <p className="mt-0.5 break-all text-sm text-ink-500">{s.email}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
            <span>Enrolled: <b className="text-ink-700">{s.enrolledCount}</b></span>
            <span>Certs: <b className="text-ink-700">{s.certificates}</b></span>
            <span>Points: <b className="text-ink-700">{s.totalPoints}</b></span>
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between border-t border-ink-100 px-4 py-2">
        <span className="text-xs text-ink-400">Actions</span>
        <UserActions s={s} onEdit={onEdit} onDelete={onDelete} />
      </div>
      {expanded && (
        <div className="border-t border-ink-100 bg-ink-50/50 px-3 py-4">
          <OverridePanel userId={s._id} />
        </div>
      )}
    </div>
  );
}

function EditUserModal({ s, onClose }: { s: AdminStudent; onClose: () => void }) {
  const update = useUpdateStudent();
  const [name, setName] = useState(s.name);
  const [email, setEmail] = useState(s.email);

  const submit = () => {
    update.mutate(
      { userId: s._id, name: name.trim(), email: email.trim() },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-ink-900">Edit user</h3>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase text-ink-400">Name</span>
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase text-ink-400">Email</span>
            <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={update.isPending} disabled={!name.trim() || !email.trim()} onClick={submit}>Save</Button>
        </div>
      </div>
    </div>
  );
}

function DeleteUserModal({ s, onClose }: { s: AdminStudent; onClose: () => void }) {
  const del = useDeleteStudent();
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-3 text-lg font-bold text-ink-900">Delete {s.name}?</h3>
        <p className="mt-1 text-sm text-ink-500">This permanently removes the user and all their progression, enrolments and certificates. This can't be undone.</p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="danger" className="flex-1" loading={del.isPending} onClick={() => del.mutate({ userId: s._id }, { onSuccess: onClose })}>Delete</Button>
        </div>
      </div>
    </div>
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
