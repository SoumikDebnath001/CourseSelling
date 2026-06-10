"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { useCreateCourse, useCategoriesAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/Button";

export default function NewCoursePage() {
  const router = useRouter();
  const create = useCreateCourse();
  const { list } = useCategoriesAdmin();
  const [thumb, setThumb] = useState<File | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
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
          <Field label="Price (₹, 0 = free)">
            <input name="price" type="number" min={0} defaultValue={0} className="input" />
          </Field>
          <Field label="Category">
            <select name="category" className="input">
              <option value="">— none —</option>
              {list.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Tags (comma separated)">
          <input name="tags" className="input" placeholder="bowling, spin, beginner" />
        </Field>
        <Field label="Requirements (one per line)">
          <textarea name="instructions" className="input min-h-16" />
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
