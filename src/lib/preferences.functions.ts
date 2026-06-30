import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("email,full_name,weekly_summary_email,created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      email: data?.email ?? null,
      fullName: data?.full_name ?? null,
      weeklySummaryEmail: data?.weekly_summary_email ?? true,
      memberSince: data?.created_at ?? null,
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { fullName: string }) => {
    if (!data?.fullName || !data.fullName.trim()) throw new Error("Nome obrigatório.");
    return { fullName: data.fullName.trim() };
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.fullName, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateMyNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { weeklySummaryEmail: boolean }) => data)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({
        weekly_summary_email: data.weeklySummaryEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const changeMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { newPassword: string }) => {
    if (!data?.newPassword || data.newPassword.length < 8) {
      throw new Error("A senha deve ter pelo menos 8 caracteres.");
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.newPassword,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
