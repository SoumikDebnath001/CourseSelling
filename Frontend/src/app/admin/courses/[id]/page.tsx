"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Video, ClipboardCheck, Trophy, Upload, Award, Eye, Layers, Sparkles, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { TestBuilder } from "@/components/admin/TestBuilder";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  useAdminCourse,
  useCourseStatus,
  useCourseBuilderActions,
  useUpdateCourse,
} from "@/hooks/useAdmin";
import { useSettings } from "@/hooks/useSettings";
import { LevelSlider } from "@/components/course/LevelSlider";
import { generateCertificate } from "@/lib/certificate";
import type { Course, CourseSection, Module, TestRef } from "@/types/api";

type TestTarget =
  | { scope: "module"; moduleId: string; existing?: TestRef | null }
  | { scope: "course"; existing?: TestRef | null }
  | { scope: "section"; section: string; existing?: TestRef | null };

function Builder({ courseId }: { courseId: string }) {
  const { data: course, isLoading } = useAdminCourse(courseId);
  const status = useCourseStatus(courseId);
  const actions = useCourseBuilderActions(courseId);
  const { settings } = useSettings();
  const [newModule, setNewModule] = useState("");
  const [testTarget, setTestTarget] = useState<TestTarget | null>(null);

  const labelFor = (key: string) =>
    settings.levels.find((l) => l.key === key)?.label ||
    settings.levels.find((l) => l.key === key)?.name ||
    key;

  const renderModule = (m: Module) => (
    <ModuleCard
      key={m._id}
      module={m}
      onDeleteModule={() => { if (confirm("Delete module and its topics?")) actions.deleteModule.mutate(m._id); }}
      onAddTopic={(fd) => actions.addTopic.mutate(fd)}
      addingTopic={actions.addTopic.isPending}
      onDeleteTopic={(id) => { if (confirm("Delete topic?")) actions.deleteTopic.mutate(id); }}
      onSaveModulePoints={(points) => actions.updateModule.mutate({ id: m._id, points })}
      onSaveTopicPoints={(id, points) => actions.updateTopic.mutate({ id, points })}
      onEditTest={() => setTestTarget({ scope: "module", moduleId: m._id, existing: m.test })}
      onDeleteTest={() => { if (m.test && confirm("Delete module test?")) actions.deleteTest.mutate(m.test._id); }}
    />
  );

  if (isLoading) return <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>;
  if (!course) return <p className="py-16 text-center text-ink-400">Course not found.</p>;

  return (
    <>
      <Link href="/admin/courses" className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        <ChevronLeft className="h-4 w-4" /> All courses
      </Link>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink-900">{course.courseName}</h1>
          <p className="text-sm text-ink-400">{course.modules.length} modules · {course.status}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/courses/${course.slug}`} className="btn-ghost px-3 py-1.5 text-sm">Preview</Link>
          <Button
            variant={course.status === "Published" ? "ghost" : "primary"}
            loading={status.isPending}
            onClick={() => status.mutate(course.status === "Published" ? "Draft" : "Published")}
          >
            {course.status === "Published" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {course.courseType === "progressive" && (course.sections?.length ?? 0) > 0 ? (
        /* Progressive: modules grouped under auto-generated, level-derived sections. */
        <div className="mt-6 space-y-8">
          {[...course.sections!].sort((a, b) => a.order - b.order).map((sec) => (
            <SectionBlock
              key={sec.levelKey}
              label={labelFor(sec.levelKey)}
              section={sec}
              modules={course.modules.filter((m) => m.section === sec.levelKey)}
              renderModule={renderModule}
              addingModule={actions.addModule.isPending}
              togglingPhysical={actions.updateSection.isPending}
              onAddModule={(name) => actions.addModule.mutate({ moduleName: name, section: sec.levelKey })}
              onTogglePhysical={(v) => actions.updateSection.mutate({ levelKey: sec.levelKey, requiresPhysicalAssessment: v })}
              onEditSectionTest={() => setTestTarget({ scope: "section", section: sec.levelKey, existing: sec.finalTest })}
              onDeleteSectionTest={() => { if (sec.finalTest && confirm("Delete this section's final test?")) actions.deleteTest.mutate(sec.finalTest._id); }}
            />
          ))}
        </div>
      ) : (
        /* Miscellaneous: a flat module list and a single final course test. */
        <>
          <div className="mt-6 space-y-4">{course.modules.map(renderModule)}</div>

          <div className="card mt-4 flex items-center gap-2 p-3">
            <input className="input" placeholder="New module name" value={newModule} onChange={(e) => setNewModule(e.target.value)} />
            <Button
              loading={actions.addModule.isPending}
              onClick={() => { if (newModule.trim()) { actions.addModule.mutate({ moduleName: newModule.trim() }); setNewModule(""); } }}
            >
              <Plus className="h-4 w-4" /> Module
            </Button>
          </div>

          <div className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 shrink-0 text-ball-600" />
              <div>
                <p className="font-semibold text-ink-900">Final course test</p>
                <p className="text-xs text-ink-400">{course.finalTest ? `${course.finalTest.questions?.length ?? 0} questions` : "Optional — covers the whole course"}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" onClick={() => setTestTarget({ scope: "course", existing: course.finalTest })}>
                {course.finalTest ? "Edit" : "Add final test"}
              </Button>
              {course.finalTest && (
                <button onClick={() => { if (confirm("Delete final test?")) actions.deleteTest.mutate(course.finalTest!._id); }} className="rounded-lg p-2 text-ink-400 hover:text-ball-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bulk points */}
      <BulkPointsCard onApply={(v) => actions.applyPoints.mutate(v)} applying={actions.applyPoints.isPending} />

      {/* Type, level & points */}
      <CourseSettingsCard course={course} />

      {/* Certificate */}
      <CertificateCard course={course} />

      {testTarget && (
        <TestBuilder
          courseId={courseId}
          scope={testTarget.scope}
          moduleId={testTarget.scope === "module" ? testTarget.moduleId : undefined}
          section={testTarget.scope === "section" ? testTarget.section : undefined}
          existing={testTarget.existing}
          saving={actions.saveTest.isPending}
          onSave={(payload, id) =>
            actions.saveTest.mutate({ id, payload }, { onSuccess: () => setTestTarget(null) })
          }
          onClose={() => setTestTarget(null)}
        />
      )}
    </>
  );
}

/** One auto-generated, level-derived section of a progressive course in the builder. */
function SectionBlock({
  label,
  section,
  modules,
  renderModule,
  addingModule,
  togglingPhysical,
  onAddModule,
  onTogglePhysical,
  onEditSectionTest,
  onDeleteSectionTest,
}: {
  label: string;
  section: CourseSection;
  modules: Module[];
  renderModule: (m: Module) => React.ReactNode;
  addingModule: boolean;
  togglingPhysical: boolean;
  onAddModule: (name: string) => void;
  onTogglePhysical: (v: boolean) => void;
  onEditSectionTest: () => void;
  onDeleteSectionTest: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <section className="rounded-2xl border border-ink-200 bg-ink-50/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <h2 className="text-lg font-bold text-ink-900">{label} modules</h2>
            <p className="text-xs text-ink-400">{modules.length} module{modules.length === 1 ? "" : "s"} · earns the {label} certificate</p>
          </div>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
          <ShieldCheck className={`h-4 w-4 ${section.requiresPhysicalAssessment ? "text-pitch-600" : "text-ink-300"}`} />
          <span className="font-medium text-ink-700">Requires physical assessment</span>
          <input
            type="checkbox"
            checked={section.requiresPhysicalAssessment}
            disabled={togglingPhysical}
            onChange={(e) => onTogglePhysical(e.target.checked)}
            className="accent-pitch-600"
          />
        </label>
      </div>

      <div className="mt-4 space-y-4">
        {modules.length ? modules.map(renderModule) : <p className="px-1 text-sm text-ink-400">No modules in this section yet.</p>}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input className="input" placeholder={`New module in ${label}`} value={name} onChange={(e) => setName(e.target.value)} />
        <Button loading={addingModule} onClick={() => { if (name.trim()) { onAddModule(name.trim()); setName(""); } }}>
          <Plus className="h-4 w-4" /> Module
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-ink-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 shrink-0 text-ball-600" />
          <div>
            <p className="font-semibold text-ink-900">Section final test</p>
            <p className="text-xs text-ink-400">{section.finalTest ? `${section.finalTest.questions?.length ?? 0} questions` : "Optional — gates this section's certificate"}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" onClick={onEditSectionTest}>{section.finalTest ? "Edit" : "Add final test"}</Button>
          {section.finalTest && (
            <button onClick={onDeleteSectionTest} className="rounded-lg p-2 text-ink-400 hover:text-ball-600"><Trash2 className="h-4 w-4" /></button>
          )}
        </div>
      </div>
    </section>
  );
}

function ModuleCard({
  module,
  onDeleteModule,
  onAddTopic,
  addingTopic,
  onDeleteTopic,
  onSaveModulePoints,
  onSaveTopicPoints,
  onEditTest,
  onDeleteTest,
}: {
  module: Module;
  onDeleteModule: () => void;
  onAddTopic: (fd: FormData) => void;
  addingTopic: boolean;
  onDeleteTopic: (id: string) => void;
  onSaveModulePoints: (points: number) => void;
  onSaveTopicPoints: (id: string, points: number) => void;
  onEditTest: () => void;
  onDeleteTest: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-bold text-ink-900">{module.moduleName}</h3>
        <div className="flex flex-wrap items-center gap-1">
          <PointsInline label="Module pts" value={module.points ?? 0} onSave={onSaveModulePoints} />
          <button onClick={onEditTest} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-ball-600 hover:bg-ball-50">
            <ClipboardCheck className="h-3.5 w-3.5" /> {module.test ? "Edit test" : "Add test"}
          </button>
          {module.test && (
            <button onClick={onDeleteTest} className="rounded-lg p-1.5 text-ink-400 hover:text-ball-600"><Trash2 className="h-3.5 w-3.5" /></button>
          )}
          <button onClick={onDeleteModule} className="rounded-lg p-1.5 text-ink-400 hover:text-ball-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <ul className="mt-3 space-y-1">
        {module.topics.map((t) => (
          <li key={t._id} className="flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-ink-700">
              <Video className="h-4 w-4 shrink-0 text-pitch-600" /> <span className="truncate">{t.title}</span>
              {t.resources?.length > 0 && <span className="shrink-0 text-xs text-ink-400">· {t.resources.length} files</span>}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <PointsInline label="pts" value={t.points ?? 0} onSave={(p) => onSaveTopicPoints(t._id, p)} />
              <button onClick={() => onDeleteTopic(t._id)} className="text-ink-400 hover:text-ball-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </span>
          </li>
        ))}
        {module.topics.length === 0 && <li className="px-3 py-2 text-xs text-ink-400">No topics yet.</li>}
      </ul>

      {showAdd ? (
        <AddTopicForm
          moduleId={module._id}
          loading={addingTopic}
          onSubmit={(fd) => { onAddTopic(fd); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      ) : (
        <button onClick={() => setShowAdd(true)} className="mt-3 flex items-center gap-1 text-sm font-semibold text-pitch-700">
          <Plus className="h-4 w-4" /> Add topic
        </button>
      )}
    </div>
  );
}

/** Reads a video file's duration (seconds) in the browser, before upload. */
function readVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(el.src);
      resolve(Number.isFinite(el.duration) ? Math.round(el.duration) : undefined);
    };
    el.onerror = () => resolve(undefined);
    el.src = URL.createObjectURL(file);
  });
}

function AddTopicForm({ moduleId, loading, onSubmit, onCancel }: { moduleId: string; loading: boolean; onSubmit: (fd: FormData) => void; onCancel: () => void }) {
  const [video, setVideo] = useState<File | null>(null);
  const [resources, setResources] = useState<FileList | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("moduleId", moduleId);
    if (video) {
      fd.append("video", video);
      const dur = await readVideoDuration(video);
      if (dur) fd.append("timeDurationSec", String(dur));
    }
    if (resources) Array.from(resources).forEach((f) => fd.append("resources", f));
    onSubmit(fd);
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg border border-ink-200 p-3">
      <input name="title" required className="input" placeholder="Topic title" />
      <textarea name="description" className="input min-h-16" placeholder="Topic description (optional)" />
      <label className="block text-sm text-ink-600">
        <span className="mb-1 font-medium">Points awarded on completion</span>
        <input name="points" type="number" min={0} defaultValue={0} className="input" />
      </label>
      <label className="block text-sm text-ink-600">
        <span className="mb-1 flex items-center gap-1 font-medium"><Upload className="h-4 w-4" /> Video file</span>
        <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} className="text-sm" />
      </label>
      <label className="block text-sm text-ink-600">
        <span className="mb-1 font-medium">Resource files (PPT,PDF etc.)</span>
        <br />
        <input type="file" multiple onChange={(e) => setResources(e.target.files)} className="text-sm" />
      </label>
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>Add topic</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function CourseSettingsCard({ course }: { course: Course }) {
  const update = useUpdateCourse(course._id);
  const { settings } = useSettings();
  const levels = [...settings.levels].sort((a, b) => a.order - b.order);

  const entryKey = levels[0]?.key ?? "foundation";
  const [courseType, setCourseType] = useState<Course["courseType"]>(course.courseType ?? "progressive");
  const [level, setLevel] = useState(course.level ?? entryKey);
  const [maxLevel, setMaxLevel] = useState(course.maxLevel || entryKey);
  const [points, setPoints] = useState(course.points ?? 0);
  const [reqPhysical, setReqPhysical] = useState(course.requiresPhysicalAssessment ?? false);

  const dirty =
    courseType !== (course.courseType ?? "progressive") ||
    level !== (course.level ?? entryKey) ||
    maxLevel !== (course.maxLevel || entryKey) ||
    points !== (course.points ?? 0) ||
    reqPhysical !== (course.requiresPhysicalAssessment ?? false);

  const save = () => {
    const fd = new FormData();
    fd.append("courseType", courseType);
    fd.append("level", level);
    fd.append("maxLevel", maxLevel);
    fd.append("points", String(points));
    fd.append("requiresPhysicalAssessment", String(reqPhysical));
    update.mutate(fd);
  };

  return (
    <div className="card mt-6 p-4">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-brand-600" />
        <div>
          <p className="font-semibold text-ink-900">Type, level &amp; points</p>
          <p className="text-xs text-ink-400">Where this course sits in the progression and the points it awards on completion.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Course type</span>
          <select value={courseType} onChange={(e) => setCourseType(e.target.value as Course["courseType"])} className="input">
            <option value="progressive">Progressive (structured path)</option>
            <option value="miscellaneous">Miscellaneous (standalone)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Course points awarded</span>
          <input type="number" min={0} value={points} onChange={(e) => setPoints(Number(e.target.value))} className="input" />
        </label>
      </div>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-sm font-medium text-ink-700">Course level</span>
          <LevelSlider levels={levels} value={level} onChange={setLevel} />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-ink-700">Highest attainable level (progressive path)</span>
          <LevelSlider levels={levels} value={maxLevel} onChange={setMaxLevel} showDescription={false} />
        </div>
      </div>

      {courseType === "miscellaneous" ? (
        <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 bg-ink-50/50 p-3 text-sm">
          <ShieldCheck className={`h-4 w-4 ${reqPhysical ? "text-pitch-600" : "text-ink-300"}`} />
          <span className="font-medium text-ink-700">Requires a physical assessment before the certificate</span>
          <input type="checkbox" checked={reqPhysical} onChange={(e) => setReqPhysical(e.target.checked)} className="ml-auto accent-pitch-600" />
        </label>
      ) : (
        <p className="mt-4 rounded-lg border border-ink-200 bg-ink-50/50 p-3 text-xs text-ink-400">
          Progressive courses use one section per level — set the physical-assessment requirement on each section above.
        </p>
      )}

      <div className="mt-4">
        <Button onClick={save} loading={update.isPending} disabled={!dirty}>Save</Button>
      </div>
    </div>
  );
}

/** Apply one point value across the whole course, every module, or every topic at once. */
function BulkPointsCard({ onApply, applying }: { onApply: (v: { coursePoints?: number; modulePoints?: number; topicPoints?: number }) => void; applying: boolean }) {
  const [coursePoints, setCoursePoints] = useState("");
  const [modulePoints, setModulePoints] = useState("");
  const [topicPoints, setTopicPoints] = useState("");

  const apply = () => {
    const v: { coursePoints?: number; modulePoints?: number; topicPoints?: number } = {};
    if (coursePoints !== "") v.coursePoints = Number(coursePoints);
    if (modulePoints !== "") v.modulePoints = Number(modulePoints);
    if (topicPoints !== "") v.topicPoints = Number(topicPoints);
    if (Object.keys(v).length) onApply(v);
  };

  return (
    <div className="card mt-4 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-grape-600" />
        <div>
          <p className="font-semibold text-ink-900">Apply points in bulk</p>
          <p className="text-xs text-ink-400">Stamp the same value across all modules / topics. Leave a field blank to skip it. You can still fine-tune individual values above.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Course points</span>
          <input type="number" min={0} value={coursePoints} onChange={(e) => setCoursePoints(e.target.value)} className="input w-32" placeholder="—" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">All modules</span>
          <input type="number" min={0} value={modulePoints} onChange={(e) => setModulePoints(e.target.value)} className="input w-32" placeholder="—" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">All topics</span>
          <input type="number" min={0} value={topicPoints} onChange={(e) => setTopicPoints(e.target.value)} className="input w-32" placeholder="—" />
        </label>
        <Button onClick={apply} loading={applying}>Apply</Button>
      </div>
    </div>
  );
}

/** Small inline points editor used on module headers and topic rows. */
function PointsInline({ label, value, onSave }: { label: string; value: number; onSave: (points: number) => void }) {
  const [v, setV] = useState(String(value));
  const dirty = Number(v) !== value && v !== "";
  return (
    <span className="flex items-center gap-1 rounded-lg bg-ink-50 px-1.5 py-0.5">
      <span className="text-[10px] font-semibold uppercase text-ink-400">{label}</span>
      <input
        type="number"
        min={0}
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="w-12 rounded border border-ink-200 bg-white px-1 py-0.5 text-xs"
      />
      {dirty && (
        <button onClick={() => onSave(Number(v))} className="text-[10px] font-bold text-pitch-600 hover:underline">save</button>
      )}
    </span>
  );
}

function CertificateCard({ course }: { course: Course }) {
  const update = useUpdateCourse(course._id);
  const [color, setColor] = useState(course.certificateColor ?? "#4f46e5");

  const save = () => {
    const fd = new FormData();
    fd.append("certificateColor", color);
    update.mutate(fd);
  };

  const preview = () =>
    generateCertificate({ studentName: "Student Name", courseName: course.courseName, color });

  return (
    <div className="card mt-6 p-4">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-grape-600" />
        <div>
          <p className="font-semibold text-ink-900">Completion certificate</p>
          <p className="text-xs text-ink-400">Pick the accent colour students see on their certificate.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-ink-300 bg-white p-1"
          />
          <span className="font-mono text-sm text-ink-600">{color.toUpperCase()}</span>
        </label>
        <Button variant="ghost" onClick={preview}>
          <Eye className="h-4 w-4" /> Preview
        </Button>
        <Button onClick={save} loading={update.isPending} disabled={color === (course.certificateColor ?? "#4f46e5")}>
          Save colour
        </Button>
      </div>
    </div>
  );
}

export default function CourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell>
      <Builder courseId={id} />
    </AdminShell>
  );
}
