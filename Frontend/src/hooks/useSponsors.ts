"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Sponsor } from "@/types";

export function useSponsors() {
  return useQuery({
    queryKey: ["sponsors"],
    queryFn: async () => {
      const { data } = await api.get<{ sponsors: Sponsor[] }>("/sponsors");
      return data.sponsors;
    },
  });
}

export function useAdminSponsors() {
  return useQuery({
    queryKey: ["admin_sponsors"],
    queryFn: async () => {
      const { data } = await api.get<{ sponsors: Sponsor[] }>("/sponsors/admin");
      return data.sponsors;
    },
  });
}

export function useCreateSponsor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post<{ sponsor: Sponsor }>("/sponsors", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.sponsor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      queryClient.invalidateQueries({ queryKey: ["admin_sponsors"] });
    },
  });
}

export function useUpdateSponsor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const { data } = await api.put<{ sponsor: Sponsor }>(`/sponsors/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.sponsor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      queryClient.invalidateQueries({ queryKey: ["admin_sponsors"] });
    },
  });
}

export function useDeleteSponsor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sponsors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      queryClient.invalidateQueries({ queryKey: ["admin_sponsors"] });
    },
  });
}
