import { createMiddleware } from "@tanstack/react-start";

export const IMPERSONATE_KEY = "hof.impersonate";

export type ImpersonationState = {
  userId: string;
  fullName: string | null;
  email: string | null;
  startedAt: string;
};

export function getImpersonation(): ImpersonationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(IMPERSONATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ImpersonationState;
  } catch {
    return null;
  }
}

export function setImpersonation(state: ImpersonationState | null) {
  if (typeof window === "undefined") return;
  if (state) window.localStorage.setItem(IMPERSONATE_KEY, JSON.stringify(state));
  else window.localStorage.removeItem(IMPERSONATE_KEY);
  window.dispatchEvent(new CustomEvent("hof:impersonation"));
}

/**
 * Client-side function middleware that forwards the impersonation target
 * (from localStorage) as a header to every server function call.
 */
export const attachImpersonation = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const state = getImpersonation();
    return next({
      headers: state ? { "x-impersonate-user-id": state.userId } : {},
    });
  },
);
