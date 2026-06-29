import { getRequestHeader, getCookie } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AuthCtx = {
  supabase: SupabaseClient<Database>;
  userId: string;
};

export type Scope = {
  userId: string;
  db: SupabaseClient<Database>;
  impersonating: boolean;
  realUserId: string;
};

/**
 * Returns the effective user_id for the current request. Resolves the
 * impersonation target from the `x-impersonate-user-id` header or, as a
 * fallback (e.g. page reload before the client middleware kicks in), the
 * `hof_impersonate_uid` cookie. Cross-user reads use the service-role
 * client because RLS would otherwise block them.
 */
export async function resolveScope(context: AuthCtx): Promise<Scope> {
  let target: string | undefined;
  try {
    target = getRequestHeader("x-impersonate-user-id") ?? undefined;
    if (!target) target = getCookie("hof_impersonate_uid") ?? undefined;
  } catch {
    // outside request context — no impersonation
  }
  if (!target || target === context.userId) {
    return {
      userId: context.userId,
      db: context.supabase,
      impersonating: false,
      realUserId: context.userId,
    };
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Error("Impersonação requer privilégios de administrador.");
  return {
    userId: target,
    db: supabaseAdmin as unknown as SupabaseClient<Database>,
    impersonating: true,
    realUserId: context.userId,
  };
}
