"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { useCreateCourse, useCategoriesAdmin } from "@/hooks/useAdmin";
import { useSettings } from "@/hooks/useSettings";
import { LevelSlider } from "@/components/course/LevelSlider";
import { Button } from "@/components/ui/Button";

export default function NewCoursePage() {
  const router = useRouter();
  const create = useCreateCourse();
  const { list } = useCategoriesAdmin();
  const { settings } = useSettings();
  const levels = [...settings.levels].sort((a, b) => a.order - b.order);
  const entryKey = levels[0]?.key ?? "foundation";

  const [thumb, setThumb] = useState<File | null>(null);
  const [level, setLevel] = useState(entryKey);
  const [maxLevel, setMaxLevel] = useState(entryKey);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("level", level);
    fd.set("maxLevel", maxLevel);
    if (thumb) fd.append("thumbnail", thumb);
    create.mutate(fd, { onSuccess: (course) => router.push(`/admin/courses/${course._id}`) });
  };

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-ink-900">New course</h1>
      <form onSubmit={onSubmit} className="card mt-5 max-w-2xl space-y-4 p-6">
        <Field label="Course name">
          <input name="courseName" required className="input" placeholder="e.g. Mastering Off-Spin Bowling" />
        </Field>
        <Field label="Short description">
          <textarea name="courseDescription" required className="input min-h-20" placeholder="What is this course about?" />
        </Field>
        <Field label="What you'll learn (one per line)">
          <textarea name="whatYouWillLearn" className="input min-h-20" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (KES, 0 = free)">
            <input name="price" type="number" min={0} defaultValue={0} className="input" />
          </Field>
          <Field label="Path / Category (required)">
            <select name="category" required defaultValue="" className="input">
              <option value="" disabled>Select a path…</option>
              {list.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <p className="-mt-2 text-xs text-ink-400">
          Every course must belong to a Path / Category — it powers filtering, progression and grouping.{" "}
          <a href="/admin/categories" className="font-medium text-pitch-600 hover:underline">Manage paths</a>
        </p>

        <Field label="Course type">
          <select name="courseType" defaultValue="progressive" className="input">
            <option value="progressive">Progressive (structured path)</option>
            <option value="miscellaneous">Miscellaneous (standalone)</option>
          </select>
        </Field>

        <div>
          <span className="mb-1 block text-sm font-medium text-ink-700">Course level</span>
          <LevelSlider levels={levels} value={level} onChange={setLevel} />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-ink-700">Highest attainable level (progressive path)</span>
          <LevelSlider levels={levels} value={maxLevel} onChange={setMaxLevel} showDescription={false} />
        </div>

        <Field label="Points awarded on completion">
          <input name="points" type="number" min={0} defaultValue={0} className="input" />
        </Field>
        <Field label="Requirements (one per line)">
          <textarea name="instructions" className="input min-h-16" />
        </Field>
        <Field label="Certificate colour">
          <div className="flex items-center gap-3">
            <input
              name="certificateColor"
              type="color"
              defaultValue="#4f46e5"
              className="h-10 w-16 cursor-pointer rounded border border-ink-300 bg-white p-1"
            />
            <span className="text-xs text-ink-400">Accent colour used on the course completion certificate.</span>
          </div>
        </Field>
        <Field label="Thumbnail">
          <input type="file" accept="image/*" onChange={(e) => setThumb(e.target.files?.[0] ?? null)} className="text-sm" />
        </Field>
        <Button type="submit" loading={create.isPending} className="py-2.5">Create &amp; add content</Button>
      </form>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-700">{label}</span>
      {children}
    </label>
  );
}
