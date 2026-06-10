"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "@/lib/axios";
import toast from "react-hot-toast";
import type { CommentNode } from "@/types/api";

export function useComments(topicId: string) {
  return useQuery({
    queryKey: ["comments", topicId],
    queryFn: async () => {
      const { data } = await api.get<{ comments: CommentNode[] }>(`/topics/${topicId}/comments`);
      return data.comments;
    },
    enabled: !!topicId,
  });
}

export function useCommentActions(topicId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["comments", topicId] });
  const onError = (err: unknown) => toast.error(apiError(err));

  const add = useMutation({
    mutationFn: (vars: { text: string; parentId?: string }) =>
      api.post(`/topics/${topicId}/comments`, vars),
    onSuccess: invalidate,
    onError,
  });
  const like = useMutation({ mutationFn: (id: string) => api.post(`/comments/${id}/like`), onSuccess: invalidate, onError });
  const pin = useMutation({ mutationFn: (id: string) => api.patch(`/comments/${id}/pin`), onSuccess: invalidate, onError });
  const star = useMutation({ mutationFn: (id: string) => api.patch(`/comments/${id}/star`), onSuccess: invalidate, onError });
  const edit = useMutation({
    mutationFn: (vars: { id: string; text: string }) => api.put(`/comments/${vars.id}`, { text: vars.text }),
    onSuccess: invalidate,
    onError,
  });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/comments/${id}`), onSuccess: invalidate, onError });

  return { add, like, pin, star, edit, remove };
}
