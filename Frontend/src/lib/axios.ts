import axios from "axios";
import { useAuth } from "@/store/auth";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  withCredentials: true,
});

// Attach JWT from the auth store to every request.
api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, drop the session so the UI can redirect to login.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      useAuth.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);

/** Pull a human-readable message out of an axios error. */
export function apiError(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message ?? error.message ?? fallback;
  }
  return fallback;
}
