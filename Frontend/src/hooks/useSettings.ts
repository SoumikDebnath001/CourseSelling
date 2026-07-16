"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, apiError } from "@/lib/axios";
import type { Settings } from "@/types/api";
import { DEFAULT_TERMS } from "@/lib/terms";

/** Sensible defaults so the UI renders before settings load / if the request fails. */
export const DEFAULT_LEVELS = [
  { key: "foundation", name: "Foundation", label: "Basic", description: "Basic learning stage focused on core concepts and fundamentals.", order: 0, unlockPoints: 0 },
  { key: "level1", name: "Level 1", label: "Intermediate", description: "Intermediate learning stage focused on skill development and practical application.", order: 1, unlockPoints: 100 },
  { key: "level2", name: "Level 2", label: "Professional", description: "Professional learning stage focused on advanced mastery and performance.", order: 2, unlockPoints: 500 },
];

/** Footer columns shown until settings load / if the request fails. */
export const DEFAULT_FOOTER_LINKS = [
  {
    title: "Sitemap",
    items: [
      { label: "Programs", href: "/catalog" },
      { label: "Events", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Donations", href: "/about" },
      { label: "Blogs", href: "/about" },
    ],
  },
];

/** Signatory block printed on certificates until the admin customises it. */
export const DEFAULT_CERTIFICATE_BRANDING = {
  coachName: "Coach David Obuya",
  roleLine1: "High Performance Coach Level 3",
  roleLine2: "ICC Tutor — Africa",
  signatories: [],
};

export const DEFAULT_SETTINGS: Settings = {
  platformName: "Cricket Academy",
  hero: {},
  foundation: {},
  certificate: { ...DEFAULT_CERTIFICATE_BRANDING },
  footer: {},
  about: { images: [] },
  socials: {},
  socialOrder: {},
  terms: { content: DEFAULT_TERMS },
  footerLinks: DEFAULT_FOOTER_LINKS,
  watermark: { enabled: true, opacity: 0.04 },
  levels: DEFAULT_LEVELS,
};

/** Public platform settings — branding, contact, hero copy, foundation links. */
export function useSettings() {
  const query = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get<{ settings: Partial<Settings> }>("/settings");
      const s = data.settings ?? {};
      // Mongoose omits empty nested objects from JSON — re-fill them so the UI can
      // always read settings.hero.badge etc. without guarding every access.
      return {
        ...DEFAULT_SETTINGS,
        ...s,
        hero: { ...s.hero },
        foundation: { ...s.foundation },
        certificate: { ...DEFAULT_CERTIFICATE_BRANDING, ...s.certificate, signatories: s.certificate?.signatories ?? [] },
        footer: { ...s.footer },
        about: { images: [], ...s.about },
        socials: { ...s.socials },
        socialOrder: { ...s.socialOrder },
        terms: { content: s.terms?.content || DEFAULT_TERMS },
        footerLinks: s.footerLinks?.length ? s.footerLinks : DEFAULT_FOOTER_LINKS,
        watermark: { ...DEFAULT_SETTINGS.watermark, ...s.watermark },
      } as Settings;
    },
    staleTime: 5 * 60_000,
  });
  return { ...query, settings: query.data ?? DEFAULT_SETTINGS };
}

/** Admin: save platform settings. */
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Settings>) => {
      const { data } = await api.put<{ settings: Settings }>("/settings", payload);
      return data.settings;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

/** Fields for creating/updating a certificate signatory (signature = transparent PNG). */
export interface SignatoryInput {
  name?: string;
  roleLine1?: string;
  roleLine2?: string;
  signature?: File | null;
}

function signatoryFormData(input: SignatoryInput): FormData {
  const fd = new FormData();
  if (input.name !== undefined) fd.append("name", input.name);
  if (input.roleLine1 !== undefined) fd.append("roleLine1", input.roleLine1);
  if (input.roleLine2 !== undefined) fd.append("roleLine2", input.roleLine2);
  if (input.signature) fd.append("signature", input.signature);
  return fd;
}

/** Admin: add a person to the certificate-signatories pool. */
export function useAddSignatory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SignatoryInput) => {
      const { data } = await api.post<{ settings: Settings }>("/settings/signatories", signatoryFormData(input));
      return data.settings;
    },
    onSuccess: () => {
      toast.success("Signatory added");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

/** Admin: update a signatory's details and/or replace their signature image. */
export function useUpdateSignatory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: SignatoryInput & { id: string }) => {
      const { data } = await api.put<{ settings: Settings }>(`/settings/signatories/${id}`, signatoryFormData(input));
      return data.settings;
    },
    onSuccess: () => {
      toast.success("Signatory updated");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

/** Admin: remove a signatory from the pool. */
export function useDeleteSignatory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ settings: Settings }>(`/settings/signatories/${id}`);
      return data.settings;
    },
    onSuccess: () => {
      toast.success("Signatory removed");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

/** Admin: upload (and replace) the foundation image shown on the home page. */
export function useUploadFoundationImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post<{ settings: Settings }>("/settings/foundation-image", fd);
      return data.settings;
    },
    onSuccess: () => {
      toast.success("Foundation image updated");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

/** Admin: upload and append an image shown on the public About page. */
export function useUploadAboutImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post<{ settings: Settings }>("/settings/about-image", fd);
      return data.settings;
    },
    onSuccess: () => {
      toast.success("Image added");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

/** Admin: remove an About-page image by its storage key. */
export function useRemoveAboutImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (publicId: string) => {
      const { data } = await api.delete<{ settings: Settings }>("/settings/about-image", {
        params: { publicId },
      });
      return data.settings;
    },
    onSuccess: () => {
      toast.success("Image removed");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

/** Turn a YouTube URL (watch, youtu.be, or embed) into an embeddable URL. */
export function youtubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}
