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

async function logAudit(
  actorId: string,
  targetUserId: string,
  action: string,
  details: Record<string, unknown> = {},
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("user_audit_log").insert({
    actor_user_id: actorId,
    target_user_id: targetUserId,
    action,
    details: details as never,
  });
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
    return { roles, isAdmin: roles.includes("admin") };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, is_active, onboarding_completed, created_at");
    if (pErr) throw new Error(pErr.message);

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: conns } = await supabaseAdmin
      .from("meta_connections")
      .select("user_id, ad_account_id, last_synced_at");

    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r: { user_id: string; role: string }) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    const connByUser = new Map<string, { ad_account_id: string | null; last_synced_at: string | null }>();
    (conns ?? []).forEach((c) => connByUser.set(c.user_id, c));

    return (profiles ?? []).map((p) => {
      const conn = connByUser.get(p.id);
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        is_active: p.is_active,
        onboarding_completed: p.onboarding_completed,
        created_at: p.created_at,
        roles: rolesByUser.get(p.id) ?? [],
        meta_connected: !!conn,
        ad_account_id: conn?.ad_account_id ?? null,
        last_synced_at: conn?.last_synced_at ?? null,
      };
    });
  });

export const adminGlobalStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: roles }, { data: profiles }, { data: conns }, { data: metrics }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("profiles").select("is_active"),
      supabaseAdmin.from("meta_connections").select("ad_account_id"),
      supabaseAdmin.from("daily_metrics").select("purchases, leads, revenue, spend"),
    ]);
    const mentors = new Set((roles ?? []).filter((r) => r.role === "mentor").map((r) => r.user_id));
    const admins = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
    return {
      total_mentors: mentors.size,
      total_admins: admins.size,
      total_active: (profiles ?? []).filter((p) => p.is_active).length,
      total_inactive: (profiles ?? []).filter((p) => !p.is_active).length,
      total_meta_connections: (conns ?? []).filter((c) => c.ad_account_id).length,
      total_conversions: (metrics ?? []).reduce(
        (acc, m) => acc + Number(m.purchases ?? 0) + Number(m.leads ?? 0),
        0,
      ),
      total_revenue: (metrics ?? []).reduce((acc, m) => acc + Number(m.revenue ?? 0), 0),
      total_spend: (metrics ?? []).reduce((acc, m) => acc + Number(m.spend ?? 0), 0),
    };
  });

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; full_name?: string | null; email?: string | null }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", data.targetUserId)
      .maybeSingle();

    const patch: { full_name?: string | null; email?: string | null } = {};
    if (data.full_name !== undefined) patch.full_name = data.full_name;
    if (data.email !== undefined) patch.email = data.email;
    if (Object.keys(patch).length) {
      const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.targetUserId);
      if (error) throw new Error(error.message);
    }
    if (data.email && data.email !== before?.email) {
      await supabaseAdmin.auth.admin.updateUserById(data.targetUserId, { email: data.email });
    }
    await logAudit(context.userId, data.targetUserId, "profile.update", {
      before,
      after: patch,
    });
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
    if (!data.is_active) {
      await supabaseAdmin.auth.admin.updateUserById(data.targetUserId, {
        ban_duration: "876000h",
      });
    } else {
      await supabaseAdmin.auth.admin.updateUserById(data.targetUserId, {
        ban_duration: "none",
      });
    }
    await logAudit(
      context.userId,
      data.targetUserId,
      data.is_active ? "user.activate" : "user.deactivate",
    );
    return { ok: true };
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      email: string;
      password: string;
      full_name?: string | null;
      role: "admin" | "mentor";
    }) => d,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name ?? null },
    });
    if (error) throw new Error(error.message);
    const newId = created.user?.id;
    if (!newId) throw new Error("Falha ao criar usuário.");
    if (data.role === "admin") {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", newId)
        .in("role", ["admin", "mentor"]);
      const { error: rErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newId, role: "admin" });
      if (rErr) throw new Error(rErr.message);
    }
    await logAudit(context.userId, newId, "user.create", {
      email: data.email,
      full_name: data.full_name,
      role: data.role,
    });

    // Envia email de boas-vindas com a senha temporária (não bloqueia a criação se falhar)
    try {
      const { renderToStaticMarkup } = await import("react-dom/server");
      const { WelcomeEmail } = await import("@/emails/WelcomeEmail");
      const { sendEmail } = await import("@/lib/email.server");
      const html = renderToStaticMarkup(
        WelcomeEmail({
          nome: data.full_name ?? "mentorado(a)",
          email: data.email,
          senhaTemporaria: data.password,
        })
      );
      await sendEmail({
        to: data.email,
        subject: "Bem-vindo(a) ao HOF Circle Analytics",
        html,
      });
    } catch (e) {
      console.error("[adminCreateUser] Falha ao enviar email de boas-vindas:", e);
    }

    return { ok: true, id: newId };
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; role: "admin" | "mentor" }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.targetUserId === context.userId && data.role !== "admin")
      throw new Error("Você não pode remover seu próprio acesso admin.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.targetUserId)
      .in("role", ["admin", "mentor"]);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.targetUserId, role: data.role });
    if (error) throw new Error(error.message);
    await logAudit(context.userId, data.targetUserId, "role.update", { role: data.role });
    return { ok: true };
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; password?: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    function generate() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
      let s = "";
      const arr = new Uint32Array(14);
      crypto.getRandomValues(arr);
      for (let i = 0; i < arr.length; i++) s += chars[arr[i] % chars.length];
      return s + "!9";
    }
    const password = data.password && data.password.length >= 8 ? data.password : generate();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.targetUserId, {
      password,
    });
    if (error) throw new Error(error.message);
    await logAudit(context.userId, data.targetUserId, "password.reset");

    // Envia email com a nova senha (não bloqueia a operação se falhar)
    try {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email,full_name")
        .eq("id", data.targetUserId)
        .maybeSingle();
      if (profile?.email) {
        const { renderToStaticMarkup } = await import("react-dom/server");
        const { PasswordResetEmail } = await import("@/emails/PasswordResetEmail");
        const { sendEmail } = await import("@/lib/email.server");
        const html = renderToStaticMarkup(
          PasswordResetEmail({
            nome: profile.full_name ?? "mentorado(a)",
            novaSenha: password,
          })
        );
        await sendEmail({
          to: profile.email,
          subject: "Sua senha foi redefinida — HOF Circle Analytics",
          html,
        });
      }
    } catch (e) {
      console.error("[adminResetPassword] Falha ao enviar email:", e);
    }

    return { ok: true, password };
  });

export const adminListAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("user_audit_log")
      .select("id, action, details, created_at, actor_user_id")
      .eq("target_user_id", data.targetUserId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const actorIds = Array.from(
      new Set((rows ?? []).map((r) => r.actor_user_id).filter(Boolean) as string[]),
    );
    let actorMap = new Map<string, { email: string | null; full_name: string | null }>();
    if (actorIds.length) {
      const { data: actors } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", actorIds);
      (actors ?? []).forEach((a) => actorMap.set(a.id, { email: a.email, full_name: a.full_name }));
    }
    return (rows ?? []).map((r) => ({
      ...r,
      actor: r.actor_user_id ? actorMap.get(r.actor_user_id) ?? null : null,
    }));
  });
