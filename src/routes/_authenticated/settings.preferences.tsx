import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, User, Lock, Bell } from "lucide-react";
import { toast } from "sonner";
import {
  getMyPreferences,
  updateMyProfile,
  updateMyNotificationPrefs,
  changeMyPassword,
} from "@/lib/preferences.functions";

export const Route = createFileRoute("/_authenticated/settings/preferences")({
  component: PreferencesPage,
});

function PreferencesPage() {
  const qc = useQueryClient();
  const getPrefs = useServerFn(getMyPreferences);
  const saveProfile = useServerFn(updateMyProfile);
  const saveNotifs = useServerFn(updateMyNotificationPrefs);
  const savePassword = useServerFn(changeMyPassword);

  const { data, isLoading } = useQuery({
    queryKey: ["my-preferences"],
    queryFn: () => getPrefs(),
  });

  const [fullName, setFullName] = useState("");
  const [weeklyEmail, setWeeklyEmail] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (data) {
      setFullName(data.fullName ?? "");
      setWeeklyEmail(data.weeklySummaryEmail);
    }
  }, [data]);

  const profileMutation = useMutation({
    mutationFn: () => saveProfile({ data: { fullName } }),
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      qc.invalidateQueries({ queryKey: ["my-preferences"] });
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const notifMutation = useMutation({
    mutationFn: (value: boolean) => saveNotifs({ data: { weeklySummaryEmail: value } }),
    onSuccess: () => toast.success("Preferência salva."),
    onError: (e: Error) => {
      toast.error(e.message);
      setWeeklyEmail((v) => !v);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => savePassword({ data: { newPassword } }),
    onSuccess: () => {
      toast.success("Senha alterada com sucesso.");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handlePasswordSubmit() {
    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    passwordMutation.mutate();
  }

  if (isLoading) {
    return (
      <AppShell title="Preferências" subtitle="Gerencie sua conta">
        <div className="grid h-[40vh] place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Preferências" subtitle="Gerencie sua conta e como você usa a plataforma">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
          ← Voltar ao dashboard
        </Link>

        {/* Perfil */}
        <section className="surface-panel p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold tracking-tight">Perfil</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Suas informações básicas na plataforma.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome completo</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input value={data?.email ?? ""} disabled className="mt-1.5 opacity-60" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                O email não pode ser alterado por aqui.
              </p>
            </div>
            <Button
              onClick={() => profileMutation.mutate()}
              disabled={profileMutation.isPending || !fullName.trim()}
            >
              {profileMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Salvar alterações
            </Button>
          </div>
        </section>

        {/* Segurança */}
        <section className="surface-panel p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold tracking-tight">Segurança</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Altere sua senha de acesso.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nova senha</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Confirmar nova senha
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5"
                placeholder="Repita a senha"
              />
            </div>
            <Button
              onClick={handlePasswordSubmit}
              disabled={passwordMutation.isPending || !newPassword || !confirmPassword}
              variant="outline"
            >
              {passwordMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Alterar senha
            </Button>
          </div>
        </section>

        {/* Notificações */}
        <section className="surface-panel p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold tracking-tight">Notificações</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Controle o que a plataforma envia para o seu email.
          </p>

          <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-card/40 p-4">
            <div>
              <div className="text-sm font-medium">Resumo semanal por email</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Receba um resumo dos seus indicadores toda semana.
              </div>
            </div>
            <Switch
              checked={weeklyEmail}
              onCheckedChange={(v) => {
                setWeeklyEmail(v);
                notifMutation.mutate(v);
              }}
              disabled={notifMutation.isPending}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
