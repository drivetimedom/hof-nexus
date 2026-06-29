import { createMiddleware } from "@tanstack/react-start";

export const IMPERSONATE_KEY = "hof.impersonate";
export const IMPERSONATE_COOKIE = "hof_impersonate_uid";

export type ImpersonationState = {
  userId: string;
  fullName: string | null;
  email: string | null;
  startedAt: string;
};

function readCookieUid(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${IMPERSONATE_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") || null : null;
}

function writeCookie(uid: string | null) {
  if (typeof document === "undefined") return;
  if (uid) {
    // 8h persistence, lax for same-site requests, accessible to JS
    document.cookie = `${IMPERSONATE_COOKIE}=${encodeURIComponent(uid)}; Path=/; Max-Age=28800; SameSite=Lax`;
  } else {
    document.cookie = `${IMPERSONATE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function getImpersonation(): ImpersonationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(IMPERSONATE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as ImpersonationState;
    // If cookie was cleared (e.g. expired), nuke localStorage too.
    const cookieUid = readCookieUid();
    if (!cookieUid || cookieUid !== state.userId) {
      // Re-hydrate the cookie from localStorage so backend stays in sync.
      writeCookie(state.userId);
    }
    return state;
  } catch {
    return null;
  }
}

export function setImpersonation(state: ImpersonationState | null) {
  if (typeof window === "undefined") return;
  if (state) {
    window.localStorage.setItem(IMPERSONATE_KEY, JSON.stringify(state));
    writeCookie(state.userId);
  } else {
    window.localStorage.removeItem(IMPERSONATE_KEY);
    writeCookie(null);
  }
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
