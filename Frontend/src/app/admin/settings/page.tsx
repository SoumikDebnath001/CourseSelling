"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import type { Settings } from "@/types/api";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      {hint && <span className="ml-2 text-xs text-ink-400">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="card max-w-2xl space-y-4 p-5">
      <div>
        <h2 className="font-semibold text-ink-900">{title}</h2>
        {description && <p className="text-xs text-ink-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState<Settings | null>(null);

  // Hydrate the editable form once settings have loaded.
  useEffect(() => {
    if (!isLoading) setForm((prev) => prev ?? structuredClone(settings));
  }, [isLoading, settings]);

  if (!form) {
    return (
      <AdminShell>
        <div className="flex justify-center py-20"><Spinner /></div>
      </AdminShell>
    );
  }

  const set = (patch: Partial<Settings>) => setForm((f) => ({ ...f!, ...patch }));
  const setHero = (patch: Partial<Settings["hero"]>) => setForm((f) => ({ ...f!, hero: { ...f!.hero, ...patch } }));
  const setFoundation = (patch: Partial<Settings["foundation"]>) => setForm((f) => ({ ...f!, foundation: { ...f!.foundation, ...patch } }));
  const setWatermark = (patch: Partial<Settings["watermark"]>) => setForm((f) => ({ ...f!, watermark: { ...f!.watermark, ...patch } }));

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Settings</h1>
        <Button loading={update.isPending} onClick={() => update.mutate(form)}>
          <Save className="h-4 w-4" /> Save changes
        </Button>
      </div>

      <div className="mt-6 space-y-6">
        <Section title="Branding & contact" description="Shown in the navbar, footer and across the site.">
          <Field label="Platform name">
            <input className="input" value={form.platformName} onChange={(e) => set({ platformName: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className="input" type="email" placeholder="hello@example.com" value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Contact phone">
            <input className="input" value={form.contactPhone ?? ""} onChange={(e) => set({ contactPhone: e.target.value })} />
          </Field>
          <Field label="Place / address">
            <input className="input" value={form.place ?? ""} onChange={(e) => set({ place: e.target.value })} />
          </Field>
        </Section>

        <Section title="Home hero" description="Headline and the intro video shown on the home page.">
          <Field label="Badge" hint="small pill above the headline">
            <input className="input" placeholder="🏏 Online Cricket Academy" value={form.hero.badge ?? ""} onChange={(e) => setHero({ badge: e.target.value })} />
          </Field>
          <Field label="Title">
            <input className="input" placeholder="Train at Home with the Best Coaches" value={form.hero.title ?? ""} onChange={(e) => setHero({ title: e.target.value })} />
          </Field>
          <Field label="Highlight word" hint="rendered as a coloured chip after the title">
            <input className="input" value={form.hero.highlight ?? ""} onChange={(e) => setHero({ highlight: e.target.value })} />
          </Field>
          <Field label="Subtitle">
            <textarea className="input" rows={2} value={form.hero.subtitle ?? ""} onChange={(e) => setHero({ subtitle: e.target.value })} />
          </Field>
          <Field label="Intro video (YouTube URL)" hint="embedded in the Benefits section">
            <input className="input" placeholder="https://youtube.com/watch?v=..." value={form.hero.videoUrl ?? ""} onChange={(e) => setHero({ videoUrl: e.target.value })} />
          </Field>
        </Section>

        <Section title="Foundation" description="The 'Contribute to our Foundation' section below the courses on the home page.">
          <Field label="Foundation website URL">
            <input className="input" placeholder="https://foundation.example.com" value={form.foundation.websiteUrl ?? ""} onChange={(e) => setFoundation({ websiteUrl: e.target.value })} />
          </Field>
          <Field label="Foundation YouTube URL">
            <input className="input" placeholder="https://youtube.com/watch?v=..." value={form.foundation.youtubeUrl ?? ""} onChange={(e) => setFoundation({ youtubeUrl: e.target.value })} />
          </Field>
        </Section>

        <Section title="Watermark" description="Faint academy icon shown behind every page except the home page.">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.watermark.enabled} onChange={(e) => setWatermark({ enabled: e.target.checked })} className="h-4 w-4 rounded border-ink-300" />
            <span className="text-sm font-medium text-ink-700">Show watermark</span>
          </label>
          <Field label={`Opacity — ${Math.round((form.watermark.opacity ?? 0.04) * 100)}%`}>
            <input
              type="range"
              min={0}
              max={0.2}
              step={0.005}
              value={form.watermark.opacity ?? 0.04}
              onChange={(e) => setWatermark({ opacity: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
        </Section>
      </div>
    </AdminShell>
  );
}
