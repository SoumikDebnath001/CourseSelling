"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { useCreateCourse, useCategoriesAdmin } from "@/hooks/useAdmin";
import { useSettings } from "@/hooks/useSettings";
import { LevelSlider } from "@/components/course/LevelSlider";
import { Button } from "@/components/ui/Button";
import { formatBytes, formatLabel } from "@/lib/format";

export default function NewCoursePage() {
  const router = useRouter();
  const create = useCreateCourse();
  const { list } = useCategoriesAdmin();
  const { settings } = useSettings();
  const levels = [...settings.levels].sort((a, b) => a.order - b.order);
  const entryKey = levels[0]?.key ?? "foundation";

  const [thumb, setThumb] = useState<File | null>(null);
  const [courseType, setCourseType] = useState<"progressive" | "miscellaneous">("progressive");
  const [level, setLevel] = useState(entryKey);
  const [maxLevel, setMaxLevel] = useState(entryKey);
  const [signatoryIds, setSignatoryIds] = useState<string[]>([]);
  const signatoryPool = settings.certificate?.signatories ?? [];

  const toggleSignatory = (id: string) =>
    setSignatoryIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= 3 ? ids : [...ids, id]
    );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("level", level);
    // Standalone courses sit at ONE level — no level range is sent.
    if (courseType === "progressive") fd.set("maxLevel", maxLevel);
    fd.set("certificateSignatories", JSON.stringify(signatoryIds));
    if (thumb) fd.append("thumbnail", thumb);
    create.mutate(fd, { onSuccess: (course) => router.push(`/admin/courses/${course._id}`) });
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl pb-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">Create New Course</h1>
          <p className="mt-1.5 text-sm sm:text-base text-ink-500">
            Configure the details, curriculum, and progression rules for your new course.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 sm:space-y-8">
          {/* Section 1: Basic Info */}
          <div className="card overflow-hidden border border-ink-200 shadow-sm">
            <div className="bg-gradient-to-r from-teal-50 to-amber-50 px-5 py-4 sm:px-6 border-b border-ink-200">
              <h2 className="text-base sm:text-lg font-bold text-ink-900">Basic Information</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <Field label="Course name">
                <input name="courseName" required className="input w-full" placeholder="e.g. Mastering Off-Spin Bowling" />
              </Field>
              <Field label="Short description">
                <textarea name="courseDescription" required className="input w-full min-h-[80px]" placeholder="What is this course about? Keep it concise." />
              </Field>
              <Field label="What you'll learn (one per line)">
                <textarea name="whatYouWillLearn" className="input w-full min-h-[100px]" placeholder="e.g. Flight and dip...&#10;Drift...&#10;Grip and release..." />
              </Field>
            </div>
          </div>

          {/* Section 2: Categorization & Progression */}
          <div className="card overflow-hidden border border-ink-200 shadow-sm">
            <div className="bg-gradient-to-r from-teal-50 to-amber-50 px-5 py-4 sm:px-6 border-b border-ink-200">
              <h2 className="text-base sm:text-lg font-bold text-ink-900">Categorization & Progression</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Price (KES, 0 = free)">
                  <input name="price" type="number" min={0} defaultValue={0} className="input w-full" />
                </Field>
                <Field label="Path / Category (required)">
                  <select name="category" required defaultValue="" className="input w-full">
                    <option value="" disabled>Select a path…</option>
                    {list.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </Field>
              </div>
              <p className="-mt-3 text-[11px] sm:text-xs text-ink-500">
                Every course must belong to a Path / Category to power filtering and progression.{" "}
                <a href="/admin/categories" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">Manage paths →</a>
              </p>
              
              <div className="h-px w-full bg-ink-100" />

              <Field label="Course type">
                <select
                  name="courseType"
                  value={courseType}
                  onChange={(e) => setCourseType(e.target.value as "progressive" | "miscellaneous")}
                  className="input w-full"
                >
                  <option value="progressive">Progressive (structured path)</option>
                  <option value="miscellaneous">Miscellaneous (standalone)</option>
                </select>
              </Field>

              {/* Progressive courses span a level RANGE; standalone courses sit at ONE level. */}
              <div className="space-y-5 pt-2">
                <div>
                  <span className="mb-2 block text-sm font-semibold text-ink-800">
                    {courseType === "progressive" ? "Course starting level" : "Course level"}
                  </span>
                  <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
                    <LevelSlider levels={levels} value={level} onChange={setLevel} />
                  </div>
                </div>

                {courseType === "progressive" && (
                  <div>
                    <span className="mb-2 block text-sm font-semibold text-ink-800">Highest attainable level</span>
                    <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
                      <LevelSlider levels={levels} value={maxLevel} onChange={setMaxLevel} showDescription={false} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Extra Details */}
          <div className="card overflow-hidden border border-ink-200 shadow-sm">
            <div className="bg-gradient-to-r from-teal-50 to-amber-50 px-5 py-4 sm:px-6 border-b border-ink-200">
              <h2 className="text-base sm:text-lg font-bold text-ink-900">Settings & Media</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Points awarded on completion">
                  <input name="points" type="number" min={0} defaultValue={0} className="input w-full" />
                </Field>
                <Field label="Certificate colour">
                  <div className="flex items-center gap-3">
                    <input
                      name="certificateColor"
                      type="color"
                      defaultValue="#4f46e5"
                      className="h-10 w-16 cursor-pointer rounded-lg border border-ink-300 bg-white p-1 shadow-sm transition-all hover:scale-105"
                    />
                    <span className="text-xs text-ink-500 leading-tight">Accent colour used on the completion certificate.</span>
                  </div>
                </Field>
              </div>
              
              <Field label="Certificate signatures (up to 3)">
                <div className="rounded-lg border border-ink-200 bg-ink-50/50 p-4">
                  <div className="flex flex-wrap gap-2">
                    {signatoryPool.map((s) => {
                      const checked = signatoryIds.includes(s._id);
                      return (
                        <label
                          key={s._id}
                          className={
                            "flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium transition " +
                            (checked ? "border-amber-400 bg-amber-50 text-amber-800" : "border-ink-200 text-ink-600 hover:bg-ink-50")
                          }
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSignatory(s._id)}
                            className="h-4 w-4 rounded border-ink-300"
                          />
                          <span>
                            {s.name}
                            {s.roleLine1 && <span className="ml-1 text-xs font-normal text-ink-400">— {s.roleLine1}</span>}
                          </span>
                        </label>
                      );
                    })}
                    {signatoryPool.length === 0 && (
                      <p className="text-xs text-ink-400">
                        No signatories stored yet — add them on the{" "}
                        <a href="/admin/certificates" className="font-semibold text-teal-600 hover:underline">Certificates page</a>.
                      </p>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] sm:text-xs text-ink-400">
                    These people&apos;s signature blocks are printed on this course&apos;s completion certificate.
                    With none selected, the first signatory signs. Manage the pool on the Certificates page.
                  </p>
                </div>
              </Field>

              <Field label="Requirements (one per line)">
                <textarea name="instructions" className="input w-full min-h-[80px]" placeholder="Any prerequisites before taking this course?" />
              </Field>
              
              <Field label="Course Thumbnail">
                <div className="flex flex-col gap-3 rounded-lg border border-dashed border-ink-300 bg-ink-50/50 p-5">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.gif,.avif,image/*"
                    onChange={(e) => setThumb(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-ink-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200 cursor-pointer transition-colors"
                  />
                  <p className="text-[11px] sm:text-xs text-ink-400">
                    Upload a 16:9 image to represent this course. Formats: PNG, JPG, WEBP, GIF, AVIF · no size limit.
                  </p>
                  {/* Selected file's name, format + size, shown before/after the upload. */}
                  {thumb && (
                    <p className="text-[11px] sm:text-xs font-medium text-pitch-700">
                      Selected: {thumb.name} · {formatLabel(undefined, thumb.name)} · {formatBytes(thumb.size)}
                    </p>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={create.isPending} className="w-full sm:w-auto px-8 py-3.5 text-base shadow-xl shadow-teal-600/20 transition-transform hover:scale-[1.02] active:scale-[0.98]">
              Create Course &amp; Add Content
            </Button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-700">{label}</span>
      {children}
    </label>
  );
}
