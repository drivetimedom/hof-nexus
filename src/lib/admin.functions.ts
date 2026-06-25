import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Role = "admin" | "mentor" | "moderator" | "user";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito a administradores.");
}

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const roles = (data ?? []).map((r) => r.role as Role);
    return {
      roles,
      isAdmin: roles.includes("admin"),
    };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("admin_user_summary");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminGlobalStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("admin_global_stats");
    if (error) throw new Error(error.message);
    return data?.[0] ?? null;
  });

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; full_name?: string | null; email?: string | null }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.full_name !== undefined) patch.full_name = data.full_name;
    if (data.email !== undefined) patch.email = data.email;
    if (Object.keys(patch).length) {
      const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.targetUserId);
      if (error) throw new Error(error.message);
    }
    if (data.email) {
      await supabaseAdmin.auth.admin.updateUserById(data.targetUserId, { email: data.email });
    }
    return { ok: true };
  });

export const adminSetActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; is_active: boolean }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.targetUserId === context.userId)
      throw new Error("Você não pode desativar a própria conta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: data.is_active })
      .eq("id", data.targetUserId);
    if (error) throw new Error(error.message);
    // Force sign out by banning/unbanning via auth admin (soft: only on deactivate)
    if (!data.is_active) {
      await supabaseAdmin.auth.admin.updateUserById(data.targetUserId, {
        ban_duration: "876000h", // ~100 years
      });
    } else {
      await supabaseAdmin.auth.admin.updateUserById(data.targetUserId, {
        ban_duration: "none",
      });
    }
    return { ok: true };
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; role: "admin" | "mentor" }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.targetUserId === context.userId && data.role !== "admin")
      throw new Error("Você não pode remover seu próprio acesso admin.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Replace roles: remove admin/mentor and insert the chosen one
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.targetUserId)
      .in("role", ["admin", "mentor"]);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.targetUserId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
