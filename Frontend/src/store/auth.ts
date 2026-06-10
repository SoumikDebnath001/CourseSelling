import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthKind = "user" | "admin";
export type AuthSource = "member" | "platform";

export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  kind: AuthKind;
  source?: AuthSource;
  role?: string;
}

interface AuthState {
  token: string | null;
  account: AuthAccount | null;
  setAuth: (token: string, account: AuthAccount) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
}

/**
 * Client-side session. The JWT is persisted to localStorage and attached to every
 * request by the axios interceptor. `kind` distinguishes the existing app's
 * Admins (full authoring) from Users (course consumers).
 */
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      account: null,
      setAuth: (token, account) => set({ token, account }),
      clearAuth: () => set({ token: null, account: null }),
      isAdmin: () => get().account?.kind === "admin",
    }),
    { name: "ca-courses-auth" }
  )
);
