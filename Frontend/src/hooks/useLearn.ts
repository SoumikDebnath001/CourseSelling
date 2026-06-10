"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Course, Progress } from "@/types/api";

interface FullCourseResponse {
  course: Course;
  progress: Progress;
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["full-course", courseId] }),
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
