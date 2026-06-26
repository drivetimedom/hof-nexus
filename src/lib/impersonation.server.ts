import { getRequestHeader } from "@tanstack/react-start/server";
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
 * Returns the effective user_id for the current request. If the admin is
 * impersonating another user, queries are scoped to that user via the
 * service-role client (RLS would otherwise block cross-user reads).
 */
export async function resolveScope(context: AuthCtx): Promise<Scope> {
  const target = getRequestHeader("x-impersonate-user-id");
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
