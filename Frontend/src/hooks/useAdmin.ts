"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "@/lib/axios";
import toast from "react-hot-toast";
import type { Course, CourseCardData } from "@/types/api";

/* ── Queries ─────────────────────────────────────────── */
export function useAdminCourses() {
  return useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data } = await api.get<{ courses: (CourseCardData & { status: string; modules: string[] })[] }>("/courses/admin/all");
      return data.courses;
    },
  });
}

export function useAdminCourse(id: string) {
  return useQuery({
    queryKey: ["admin-course", id],
    queryFn: async () => {
      const { data } = await api.get<{ course: Course }>(`/courses/admin/${id}`);
      return data.course;
    },
    enabled: !!id,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/dashboard");
      return data as {
        stats: { courses: number; published: number; enrollments: number; comments: number; tests: number; members: number };
        topCourses: { _id: string; courseName: string; slug: string; studentsEnrolledCount: number; status: string }[];
      };
    },
  });
}

export function useStudents(search: string) {
  return useQuery({
    queryKey: ["admin-students", search],
    queryFn: async () => {
      const { data } = await api.get("/admin/students", { params: { search: search || undefined } });
      return data.students as { _id: string; name: string; email: string; role: string; isActive: boolean; enrolledCount: number }[];
    },
  });
}

/* ── Course mutations ────────────────────────────────── */
function useInvalidate(...keys: string[]) {
  const qc = useQueryClient();
  return () => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useCreateCourse() {
  const invalidate = useInvalidate("admin-courses");
  return useMutation({
    mutationFn: async (form: FormData) => {
      const { data } = await api.post("/courses", form);
      return data.course as Course;
    },
    onSuccess: () => {
      toast.success("Course created");
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

export function useUpdateCourse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: FormData) => {
      const { data } = await api.put(`/courses/${id}`, form);
      return data.course as Course;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-course", id] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

export function useCourseStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: "Draft" | "Published") => {
      const { data } = await api.patch(`/courses/${id}/status`, { status });
      return data.course as Course;
    },
    onSuccess: (c) => {
      toast.success(c.status === "Published" ? "Course published" : "Moved to draft");
      qc.invalidateQueries({ queryKey: ["admin-course", id] });
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

export function useDeleteCourse() {
  const invalidate = useInvalidate("admin-courses");
  return useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      toast.success("Course deleted");
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

/* ── Module / Topic / Category / Test mutations ──────── */
export function useCourseBuilderActions(courseId: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-course", courseId] });
  const onError = (e: unknown) => toast.error(apiError(e));

  const addModule = useMutation({
    mutationFn: (vars: { moduleName: string; description?: string }) =>
      api.post("/modules", { ...vars, courseId }),
    onSuccess: () => { toast.success("Module added"); refresh(); },
    onError,
  });
  const deleteModule = useMutation({ mutationFn: (id: string) => api.delete(`/modules/${id}`), onSuccess: () => { toast.success("Module removed"); refresh(); }, onError });

  const addTopic = useMutation({
    mutationFn: (form: FormData) => api.post("/topics", form),
    onSuccess: () => { toast.success("Topic added"); refresh(); },
    onError,
  });
  const deleteTopic = useMutation({ mutationFn: (id: string) => api.delete(`/topics/${id}`), onSuccess: () => { toast.success("Topic removed"); refresh(); }, onError });

  const saveTest = useMutation({
    mutationFn: (vars: { id?: string; payload: Record<string, unknown> }) =>
      vars.id ? api.put(`/tests/${vars.id}`, vars.payload) : api.post("/tests", vars.payload),
    onSuccess: () => { toast.success("Test saved"); refresh(); },
    onError,
  });
  const deleteTest = useMutation({ mutationFn: (id: string) => api.delete(`/tests/${id}`), onSuccess: () => { toast.success("Test deleted"); refresh(); }, onError });

  return { addModule, deleteModule, addTopic, deleteTopic, saveTest, deleteTest };
}

export function useCategoriesAdmin() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data.categories as { _id: string; name: string; description?: string }[];
    },
  });
  const create = useMutation({
    mutationFn: (vars: { name: string; description?: string }) => api.post("/categories", vars),
    onSuccess: () => { toast.success("Category created"); qc.invalidateQueries({ queryKey: ["categories"] }); },
    onError: (e) => toast.error(apiError(e)),
  });
  return { list, create };
}
