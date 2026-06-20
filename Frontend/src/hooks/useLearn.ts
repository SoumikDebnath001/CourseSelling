"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "@/lib/axios";
import toast from "react-hot-toast";
import type {
  Course,
  Progress,
  SectionStatus,
  PhysicalAssessmentEntry,
} from "@/types/api";

interface FullCourseResponse {
  course: Course;
  progress: Progress;
  sectionStatus: SectionStatus[];
  certificateLevels: string[];
  physicalAssessments: PhysicalAssessmentEntry[];
}

export function useFullCourse(courseId: string) {
  return useQuery({
    queryKey: ["full-course", courseId],
    queryFn: async () => {
      const { data } = await api.get<FullCourseResponse>(`/courses/${courseId}/full`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useCompleteTopic(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (topicId: string) => {
      const { data } = await api.post(`/progress/${courseId}/complete-topic`, { topicId });
      return data as { completedTopics: string[] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["full-course", courseId] });
      // Completing the last topic can finish the course → points/level/certs may change.
      qc.invalidateQueries({ queryKey: ["my-progression"] });
      qc.invalidateQueries({ queryKey: ["my-certificates"] });
      qc.invalidateQueries({ queryKey: ["my-courses"] });
    },
  });
}

export interface SubmitPhysicalAssessmentVars {
  scope: "course" | "section";
  level?: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
}

/** Student: apply for a physical assessment (course-level or per-section). */
export function useSubmitPhysicalAssessment(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: SubmitPhysicalAssessmentVars) => {
      const { data } = await api.post("/physical-assessments", { courseId, ...vars });
      return data;
    },
    onSuccess: () => {
      toast.success("Submitted — we'll be in touch on WhatsApp");
      qc.invalidateQueries({ queryKey: ["full-course", courseId] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
}

export function useMyEnrolledCourses() {
  return useQuery({
    queryKey: ["my-courses"],
    queryFn: async () => {
      const { data } = await api.get("/enroll/my-courses");
      return data.courses as import("@/types/api").EnrolledCourse[];
    },
  });
}

export function useMyTransactions() {
  return useQuery({
    queryKey: ["my-transactions"],
    queryFn: async () => {
      const { data } = await api.get("/enroll/transactions");
      return data.transactions as import("@/types/api").Transaction[];
    },
  });
}
