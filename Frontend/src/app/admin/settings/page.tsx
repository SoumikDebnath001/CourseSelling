"use client";

import { useEffect, useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import type { LevelDef } from "@/types/api";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import Image from "next/image";
import { useSettings, useUpdateSettings, useUploadFoundationImage, useUploadIntroVideo } from "@/hooks/useSettings";
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

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase text-ink-400">{label}</span>
      <input
        className="input mt-1"
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
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
  const uploadFoundationImage = useUploadFoundationImage();
  const uploadIntroVideo = useUploadIntroVideo();
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
  const setFooter = (patch: Partial<Settings["footer"]>) => setForm((f) => ({ ...f!, footer: { ...f!.footer, ...patch } }));
  const setSocials = (patch: Partial<Settings["socials"]>) => setForm((f) => ({ ...f!, socials: { ...f!.socials, ...patch } }));
  const setWatermark = (patch: Partial<Settings["watermark"]>) => setForm((f) => ({ ...f!, watermark: { ...f!.watermark, ...patch } }));
  const setLevels = (levels: LevelDef[]) => setForm((f) => ({ ...f!, levels }));
  const updateLevel = (i: number, patch: Partial<LevelDef>) =>
    setLevels(form.levels.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLevel = () => {
    const order = form.levels.length;
    setLevels([...form.levels, { key: `level${order}`, name: `Level ${order}`, order, unlockPoints: 0 }]);
  };
  const removeLevel = (i: number) => setLevels(form.levels.filter((_, idx) => idx !== i));

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

        <Section
          title="Footer & socials"
          description="The 'About' blurb and social icons shown in the site footer. Contact details (email, phone, place) above power the footer's 'Get in touch'. Leave a social URL empty to hide that icon."
        >
          <Field label="About text" hint="short paragraph under the logo">
            <textarea
              className="input"
              rows={4}
              placeholder="Empowering the next generation through sport…"
              value={form.footer?.about ?? ""}
              onChange={(e) => setFooter({ about: e.target.value })}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="WhatsApp URL" value={form.socials?.whatsapp ?? ""} onChange={(v) => setSocials({ whatsapp: v })} placeholder="https://wa.me/254700000000" />
            <LabeledInput label="Instagram URL" value={form.socials?.instagram ?? ""} onChange={(v) => setSocials({ instagram: v })} placeholder="https://instagram.com/…" />
            <LabeledInput label="Facebook URL" value={form.socials?.facebook ?? ""} onChange={(v) => setSocials({ facebook: v })} placeholder="https://facebook.com/…" />
            <LabeledInput label="YouTube URL" value={form.socials?.youtube ?? ""} onChange={(v) => setSocials({ youtube: v })} placeholder="https://youtube.com/@…" />
            <LabeledInput label="X / Twitter URL" value={form.socials?.twitter ?? ""} onChange={(v) => setSocials({ twitter: v })} placeholder="https://x.com/…" />
            <LabeledInput label="LinkedIn URL" value={form.socials?.linkedin ?? ""} onChange={(v) => setSocials({ linkedin: v })} placeholder="https://linkedin.com/company/…" />
          </div>
        </Section>

        <Section
          title="Progression levels"
          description="Ordered levels learners climb within each category. 'Unlock points' is the cumulative points a learner must earn in a category (plus completing a prior-level course) to reach that level. The entry level (order 0) is always unlocked."
        >
          <div className="space-y-3">
            {form.levels
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((lvl) => {
                const i = form.levels.indexOf(lvl);
                return (
                  <div key={i} className="rounded-xl border border-ink-100 p-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_70px_110px_36px]">
                      <LabeledInput label="Internal name" value={lvl.name} onChange={(v) => updateLevel(i, { name: v })} placeholder="Level 1" />
                      <LabeledInput label="Display label" value={lvl.label ?? ""} onChange={(v) => updateLevel(i, { label: v })} placeholder="Intermediate" />
                      <LabeledInput label="Key" value={lvl.key} onChange={(v) => updateLevel(i, { key: v.trim() })} placeholder="level1" />
                      <LabeledInput label="Order" type="number" value={String(lvl.order)} onChange={(v) => updateLevel(i, { order: Number(v) })} />
                      <LabeledInput label="Unlock pts" type="number" value={String(lvl.unlockPoints)} onChange={(v) => updateLevel(i, { unlockPoints: Number(v) })} disabled={lvl.order === 0} />
                      <button
                        onClick={() => removeLevel(i)}
                        disabled={form.levels.length <= 1}
                        className="mt-5 flex h-9 items-center justify-center rounded-lg border border-ink-200 text-ink-400 hover:text-ball-600 disabled:opacity-30"
                        title="Remove level"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <span className="text-[11px] font-semibold uppercase text-ink-400">Description</span>
                      <textarea
                        className="input mt-1 min-h-12 text-sm"
                        value={lvl.description ?? ""}
                        onChange={(e) => updateLevel(i, { description: e.target.value })}
                        placeholder="Shown to learners when this level is selected."
                      />
                    </div>
                  </div>
                );
              })}
            <button onClick={addLevel} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50">
              <Plus className="h-4 w-4" /> Add level
            </button>
          </div>
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
          <Field label="Intro video" hint="uploaded clip shown in 'See the academy in action'">
            <div className="flex items-center gap-4">
              <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-900/90">
                {form.hero.introVideoUrl ? (
                  <video src={form.hero.introVideoUrl} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/60">No video</div>
                )}
              </div>
              <label className="cursor-pointer rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
                {uploadIntroVideo.isPending ? "Uploading…" : "Upload video"}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={uploadIntroVideo.isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadIntroVideo.mutate(file, { onSuccess: (s) => setHero({ introVideoUrl: s.hero.introVideoUrl }) });
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </Field>
        </Section>

        <Section title="Foundation" description="The 'Contribute to our Foundation' section below the courses on the home page.">
          <Field label="Foundation website URL">
            <input className="input" placeholder="https://foundation.example.com" value={form.foundation.websiteUrl ?? ""} onChange={(e) => setFoundation({ websiteUrl: e.target.value })} />
          </Field>
          {/* <Field label="Foundation YouTube URL">
            <input className="input" placeholder="https://youtube.com/watch?v=..." value={form.foundation.youtubeUrl ?? ""} onChange={(e) => setFoundation({ youtubeUrl: e.target.value })} />
          </Field> */}
          <Field label="Foundation image" hint="shown under the orbit on the home page">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                {form.foundation.imageUrl ? (
                  <Image src={form.foundation.imageUrl} alt="Foundation" fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-ink-400">No image</div>
                )}
              </div>
              <label className="cursor-pointer rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
                {uploadFoundationImage.isPending ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadFoundationImage.isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFoundationImage.mutate(file, { onSuccess: (s) => setFoundation({ imageUrl: s.foundation.imageUrl }) });
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
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
