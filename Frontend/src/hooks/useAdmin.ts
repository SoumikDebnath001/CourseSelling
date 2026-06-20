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

export interface AdminStudentCategory {
  category: { _id: string; name: string } | null;
  currentLevel: string;
  points: number;
}

export interface AdminStudent {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  source: "member" | "platform";
  enrolledCount: number;
  certificates: number;
  totalPoints: number;
  categories: AdminStudentCategory[];
}

export function useStudents(search: string) {
  return useQuery({
    queryKey: ["admin-students", search],
    queryFn: async () => {
      const { data } = await api.get("/admin/students", { params: { search: search || undefined } });
      return data.students as AdminStudent[];
    },
  });
}

export interface StudentProgressionDetail {
  progression: {
    _id: string;
    category: { _id: string; name: string; slug?: string } | null;
    currentLevel: string;
    points: number;
    completedCourses: string[];
  }[];
  categories: { _id: string; name: string; slug?: string }[];
  grants: { _id: string; course: { _id: string; courseName: string; slug: string } | null }[];
  levels: { key: string; name: string; label?: string; description?: string; order: number; unlockPoints: number }[];
}

/** Full per-category progression for one user (for the admin overrides panel). */
export function useStudentProgression(userId: string | null) {
  return useQuery({
    queryKey: ["admin-student-progression", userId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/students/${userId}/progression`);
      return data as { success: boolean } & StudentProgressionDetail;
    },
    enabled: !!userId,
  });
}

function useStudentMutation<V>(fn: (v: V) => Promise<unknown>, success: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(success);
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      qc.invalidateQueries({ queryKey: ["admin-student-progression"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

/** Promote/demote: set a user's level in one category. */
export function useSetStudentLevel() {
  return useStudentMutation<{ userId: string; category: string; level: string }>(
    (v) => api.patch(`/admin/students/${v.userId}/level`, { category: v.category, level: v.level }),
    "Level updated"
  );
}

/** Add/subtract points in one category. */
export function useAdjustStudentPoints() {
  return useStudentMutation<{ userId: string; category: string; delta: number }>(
    (v) => api.patch(`/admin/students/${v.userId}/points`, { category: v.category, delta: v.delta }),
    "Points updated"
  );
}

/** Grant a user direct access to a course, bypassing locks. */
export function useGrantCourseAccess() {
  return useStudentMutation<{ userId: string; course: string }>(
    (v) => api.post(`/admin/students/${v.userId}/grant`, { course: v.course }),
    "Access granted"
  );
}

export function useRevokeCourseAccess() {
  return useStudentMutation<{ userId: string; courseId: string }>(
    (v) => api.delete(`/admin/students/${v.userId}/grant/${v.courseId}`),
    "Access revoked"
  );
}

export interface AdminAnalytics {
  usersPerLevel: { level: string; name: string; count: number }[];
  totalPointsEarned: number;
  mostCompletedCourses: { course: string; courseName: string; completions: number }[];
  categoryProgression: { category: string | null; categoryName: string; learners: number; points: number; completedCourses: number }[];
  certificatesIssued: number;
  advancedLearners: number;
  totalLearners: number;
  entryLevelLearners: number;
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const { data } = await api.get("/admin/analytics");
      return data.analytics as AdminAnalytics;
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
    mutationFn: (vars: { moduleName: string; description?: string; points?: number; section?: string }) =>
      api.post("/modules", { ...vars, courseId }),
    onSuccess: () => { toast.success("Module added"); refresh(); },
    onError,
  });
  const updateSection = useMutation({
    mutationFn: (vars: { levelKey: string; requiresPhysicalAssessment: boolean }) =>
      api.patch(`/courses/${courseId}/sections/${vars.levelKey}`, { requiresPhysicalAssessment: vars.requiresPhysicalAssessment }),
    onSuccess: () => { toast.success("Section updated"); refresh(); },
    onError,
  });
  const updateModule = useMutation({
    mutationFn: (vars: { id: string; points?: number; moduleName?: string; description?: string }) => {
      const { id, ...rest } = vars;
      return api.put(`/modules/${id}`, rest);
    },
    onSuccess: () => { toast.success("Module saved"); refresh(); },
    onError,
  });
  const deleteModule = useMutation({ mutationFn: (id: string) => api.delete(`/modules/${id}`), onSuccess: () => { toast.success("Module removed"); refresh(); }, onError });

  const addTopic = useMutation({
    mutationFn: (form: FormData) => api.post("/topics", form),
    onSuccess: () => { toast.success("Topic added"); refresh(); },
    onError,
  });
  const updateTopic = useMutation({
    mutationFn: (vars: { id: string; points?: number; title?: string; description?: string }) => {
      const { id, ...rest } = vars;
      return api.put(`/topics/${id}`, rest);
    },
    onSuccess: () => { toast.success("Topic saved"); refresh(); },
    onError,
  });
  const deleteTopic = useMutation({ mutationFn: (id: string) => api.delete(`/topics/${id}`), onSuccess: () => { toast.success("Topic removed"); refresh(); }, onError });

  const applyPoints = useMutation({
    mutationFn: (vars: { coursePoints?: number; modulePoints?: number; topicPoints?: number }) =>
      api.patch(`/courses/${courseId}/points`, vars),
    onSuccess: () => { toast.success("Points applied"); refresh(); },
    onError,
  });

  const saveTest = useMutation({
    mutationFn: (vars: { id?: string; payload: Record<string, unknown> }) =>
      vars.id ? api.put(`/tests/${vars.id}`, vars.payload) : api.post("/tests", vars.payload),
    onSuccess: () => { toast.success("Test saved"); refresh(); },
    onError,
  });
  const deleteTest = useMutation({ mutationFn: (id: string) => api.delete(`/tests/${id}`), onSuccess: () => { toast.success("Test deleted"); refresh(); }, onError });

  return { addModule, updateSection, updateModule, deleteModule, addTopic, updateTopic, deleteTopic, applyPoints, saveTest, deleteTest };
}

/* ── Physical assessment applications ────────────────── */
export function usePhysicalAssessmentApplications(filter: "pending" | "approved") {
  return useQuery({
    queryKey: ["physical-assessments", filter],
    queryFn: async () => {
      const { data } = await api.get("/admin/physical-assessments", { params: { filter } });
      return data.applications as import("@/types/api").PhysicalAssessmentApplication[];
    },
  });
}

function useApprovalMutation(path: (id: string) => string, success: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(path(id)),
    onSuccess: () => {
      toast.success(success);
      qc.invalidateQueries({ queryKey: ["physical-assessments"] });
      qc.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

export function useApproveForTest() {
  return useApprovalMutation((id) => `/admin/physical-assessments/${id}/approve-test`, "Approved for test");
}
export function useApproveForCertificate() {
  return useApprovalMutation((id) => `/admin/physical-assessments/${id}/approve-certificate`, "Approved for certificate");
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
