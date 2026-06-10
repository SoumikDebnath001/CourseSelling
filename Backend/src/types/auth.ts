export type AuthKind = "user" | "admin";
/** Where a "user" identity comes from: an existing academy member, or a platform signup. */
export type AuthSource = "member" | "platform";

/** Decoded JWT payload carried on every authenticated request. */
export interface AuthPayload {
  id: string;
  kind: AuthKind;
  source?: AuthSource;
  role?: string;
  name: string;
  email: string;
}
