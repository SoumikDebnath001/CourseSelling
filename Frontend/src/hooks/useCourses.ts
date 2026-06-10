"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Category, Course, CourseCardData } from "@/types/api";

export function useCatalog(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ["catalog", params],
    queryFn: async () => {
      const { data } = await api.get<{ courses: CourseCardData[] }>("/courses", { params });
      return data.courses;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<{ categories: Category[] }>("/categories");
      return data.categories;
    },
  });
}

export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data } = await api.get<{ course: Course; isEnrolled: boolean }>(`/courses/slug/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
}
