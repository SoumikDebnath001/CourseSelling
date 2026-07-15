"use client";

import { create } from "zustand";
import { api } from "@/lib/axios";
import type { AxiosRequestConfig } from "axios";

/** One in-flight (or just-finished) admin upload, shown on the Files page and in forms. */
export interface UploadEntry {
  id: string;
  /** What's being uploaded, e.g. "Cover drive basics — video + 2 files". */
  label: string;
  /** Total bytes across the files in this request. */
  totalBytes: number;
  /** 0–100. */
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  startedAt: number;
}

interface UploadsState {
  uploads: UploadEntry[];
  start: (entry: Omit<UploadEntry, "progress" | "status" | "startedAt">) => void;
  setProgress: (id: string, progress: number) => void;
  finish: (id: string, status: "done" | "error") => void;
}

/**
 * Client-side registry of the admin's current uploads. Progress comes from axios
 * upload events; entries linger briefly after completion so the Files page shows
 * what just landed.
 */
export const useUploads = create<UploadsState>((set) => ({
  uploads: [],
  start: (entry) =>
    set((s) => ({
      uploads: [
        { ...entry, progress: 0, status: "uploading", startedAt: Date.now() },
        ...s.uploads.filter((u) => u.status === "uploading" || u.status === "processing"),
      ],
    })),
  setProgress: (id, progress) =>
    set((s) => ({
      uploads: s.uploads.map((u) =>
        u.id === id
          ? // At 100% the browser is done sending but the server is still pushing
            // the file to Stream/R2 — show that as "processing".
            { ...u, progress, status: progress >= 100 ? "processing" : "uploading" }
          : u
      ),
    })),
  finish: (id, status) =>
    set((s) => ({ uploads: s.uploads.map((u) => (u.id === id ? { ...u, status, progress: 100 } : u)) })),
}));

/** Total size of all files inside a FormData (for the progress label). */
function formDataBytes(fd: FormData): number {
  let total = 0;
  fd.forEach((v) => {
    if (v instanceof File) total += v.size;
  });
  return total;
}

/**
 * POST/PUT a multipart form while reporting upload progress to the uploads store.
 * Returns the axios response data like a plain api call would.
 */
export async function requestWithProgress<T>(
  method: "post" | "put",
  url: string,
  fd: FormData,
  label: string,
  config: AxiosRequestConfig = {}
): Promise<T> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { start, setProgress, finish } = useUploads.getState();
  start({ id, label, totalBytes: formDataBytes(fd) });
  try {
    const { data } = await api.request<T>({
      method,
      url,
      data: fd,
      ...config,
      onUploadProgress: (e) => {
        const total = e.total ?? formDataBytes(fd);
        if (total > 0) setProgress(id, Math.min(100, Math.round(((e.loaded ?? 0) / total) * 100)));
      },
    });
    finish(id, "done");
    return data;
  } catch (err) {
    finish(id, "error");
    throw err;
  }
}
