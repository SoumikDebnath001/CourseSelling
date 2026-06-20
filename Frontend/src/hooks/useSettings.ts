"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, apiError } from "@/lib/axios";
import type { Settings } from "@/types/api";

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

export const DEFAULT_SETTINGS: Settings = {
  platformName: "Cricket Academy",
  hero: {},
  foundation: {},
  footer: {},
  socials: {},
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
        footer: { ...s.footer },
        socials: { ...s.socials },
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

/** Admin: upload (and replace) the home-page intro video. */
export function useUploadIntroVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("video", file);
      const { data } = await api.post<{ settings: Settings }>("/settings/intro-video", fd);
      return data.settings;
    },
    onSuccess: () => {
      toast.success("Intro video updated");
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
