"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Video, ClipboardCheck, Trophy, Upload, Award, Eye } from "lucide-react";
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
import { generateCertificate } from "@/lib/certificate";
import type { Course, Module, TestRef } from "@/types/api";

type TestTarget =
  | { scope: "module"; moduleId: string; existing?: TestRef | null }
  | { scope: "course"; existing?: TestRef | null };

function Builder({ courseId }: { courseId: string }) {
  const { data: course, isLoading } = useAdminCourse(courseId);
  const status = useCourseStatus(courseId);
  const actions = useCourseBuilderActions(courseId);
  const [newModule, setNewModule] = useState("");
  const [testTarget, setTestTarget] = useState<TestTarget | null>(null);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>;
  if (!course) return <p className="py-16 text-center text-ink-400">Course not found.</p>;

  return (
    <>
      <Link href="/admin/courses" className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        <ChevronLeft className="h-4 w-4" /> All courses
      </Link>

      <div className="mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{course.courseName}</h1>
          <p className="text-sm text-ink-400">{course.modules.length} modules · {course.status}</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Modules */}
      <div className="mt-6 space-y-4">
        {course.modules.map((m) => (
          <ModuleCard
            key={m._id}
            module={m}
            onDeleteModule={() => { if (confirm("Delete module and its topics?")) actions.deleteModule.mutate(m._id); }}
            onAddTopic={(fd) => actions.addTopic.mutate(fd)}
            addingTopic={actions.addTopic.isPending}
            onDeleteTopic={(id) => { if (confirm("Delete topic?")) actions.deleteTopic.mutate(id); }}
            onEditTest={() => setTestTarget({ scope: "module", moduleId: m._id, existing: m.test })}
            onDeleteTest={() => { if (m.test && confirm("Delete module test?")) actions.deleteTest.mutate(m.test._id); }}
          />
        ))}
      </div>

      {/* Add module */}
      <div className="card mt-4 flex items-center gap-2 p-3">
        <input className="input" placeholder="New module name" value={newModule} onChange={(e) => setNewModule(e.target.value)} />
        <Button
          loading={actions.addModule.isPending}
          onClick={() => { if (newModule.trim()) { actions.addModule.mutate({ moduleName: newModule.trim() }); setNewModule(""); } }}
        >
          <Plus className="h-4 w-4" /> Module
        </Button>
      </div>

      {/* Final test */}
      <div className="card mt-6 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-ball-600" />
          <div>
            <p className="font-semibold text-ink-900">Final course test</p>
            <p className="text-xs text-ink-400">{course.finalTest ? `${course.finalTest.questions?.length ?? 0} questions` : "Optional — covers the whole course"}</p>
          </div>
        </div>
        <div className="flex gap-2">
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

      {/* Certificate */}
      <CertificateCard course={course} />

      {testTarget && (
        <TestBuilder
          courseId={courseId}
          scope={testTarget.scope}
          moduleId={testTarget.scope === "module" ? testTarget.moduleId : undefined}
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

function ModuleCard({
  module,
  onDeleteModule,
  onAddTopic,
  addingTopic,
  onDeleteTopic,
  onEditTest,
  onDeleteTest,
}: {
  module: Module;
  onDeleteModule: () => void;
  onAddTopic: (fd: FormData) => void;
  addingTopic: boolean;
  onDeleteTopic: (id: string) => void;
  onEditTest: () => void;
  onDeleteTest: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-ink-900">{module.moduleName}</h3>
        <div className="flex items-center gap-1">
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
          <li key={t._id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-ink-700">
              <Video className="h-4 w-4 text-pitch-600" /> {t.title}
              {t.resources?.length > 0 && <span className="text-xs text-ink-400">· {t.resources.length} files</span>}
            </span>
            <button onClick={() => onDeleteTopic(t._id)} className="text-ink-400 hover:text-ball-600"><Trash2 className="h-3.5 w-3.5" /></button>
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
        <span className="mb-1 flex items-center gap-1 font-medium"><Upload className="h-4 w-4" /> Video file</span>
        <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} className="text-sm" />
      </label>
      <label className="block text-sm text-ink-600">
        <span className="mb-1 font-medium">Resource files (optional)</span>
        <input type="file" multiple onChange={(e) => setResources(e.target.files)} className="text-sm" />
      </label>
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>Add topic</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
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
