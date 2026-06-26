import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const startImpersonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.targetUserId === context.userId)
      throw new Error("Você não pode se impersonar.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, is_active")
      .eq("id", data.targetUserId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!target) throw new Error("Usuário não encontrado.");
    if (target.is_active === false)
      throw new Error("Não é possível visualizar como um usuário inativo.");

    await supabaseAdmin.from("user_audit_log").insert({
      actor_user_id: context.userId,
      target_user_id: target.id,
      action: "impersonation.start",
      details: { target_email: target.email, target_name: target.full_name } as never,
    });

    return {
      ok: true,
      target: {
        id: target.id,
        email: target.email,
        full_name: target.full_name,
      },
    };
  });

export const endImpersonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_audit_log").insert({
      actor_user_id: context.userId,
      target_user_id: data.targetUserId,
      action: "impersonation.end",
      details: {} as never,
    });
    return { ok: true };
  });
