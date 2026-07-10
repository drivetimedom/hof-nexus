import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  getOnboardingStatus,
  startMetaOAuth,
  disconnectMeta,
  selectAdAccount,
  syncMyMetrics,
  refreshAdAccounts,
} from "@/lib/meta.functions";
import { CheckCircle2, Loader2, RefreshCw, Unplug, Plug, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/settings/integrations")({
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const getStatus = useServerFn(getOnboardingStatus);
  const startOAuth = useServerFn(startMetaOAuth);
  const disconnect = useServerFn(disconnectMeta);
  const selectAcc = useServerFn(selectAdAccount);
  const sync = useServerFn(syncMyMetrics);

  const status = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => getStatus(),
    refetchOnMount: "always",
    staleTime: 0,
  });
  const [switching, setSwitching] = useState(false);

  const connect = useMutation({
    mutationFn: async () => startOAuth(),
    onSuccess: ({ authUrl }) => (window.location.href = authUrl),
    onError: (e: Error) => toast.error(e.message),
  });
  const disc = useMutation({
    mutationFn: async () => disconnect(),
    onSuccess: () => {
      toast.success("Meta desconectada.");
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
      setSwitching(false);
      navigate({ to: "/onboarding" });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const select = useMutation({
    mutationFn: async (id: string) => {
      await selectAcc({ data: { adAccountId: id } });
      try {
        await sync();
      } catch (e) {
        console.error("[integrations] sync após troca falhou", e);
      }
    },
    onSuccess: () => {
      toast.success("Conta atualizada e sincronizada.");
      setSwitching(false);
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const syncNow = useMutation({
    mutationFn: async () => sync(),
    onSuccess: ({ days }) => {
      toast.success(`Sincronizado (${days} dias).`);
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const refreshAccounts = useServerFn(refreshAdAccounts);
  const refresh = useMutation({
    mutationFn: async () => refreshAccounts(),
    onSuccess: ({ currentStillAvailable }) => {
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
      if (currentStillAvailable) toast.success("Lista de contas atualizada.");
      else
        toast.error(
          "A conta anteriormente selecionada não existe mais. Escolha outra abaixo."
        );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const meta = status.data?.meta;
  const connected = !!meta?.connected;
  const adAccountId = meta && "adAccountId" in meta ? meta.adAccountId ?? null : null;
  const accountName = meta && "accountName" in meta ? meta.accountName ?? null : null;
  const lastSyncedAt = meta && "lastSyncedAt" in meta ? meta.lastSyncedAt ?? null : null;
  const accounts = meta && "availableAccounts" in meta ? meta.availableAccounts ?? [] : [];
  const accountUnavailable =
    meta && "accountUnavailable" in meta ? !!meta.accountUnavailable : false;

  // Se conectado sem conta escolhida (ou conta indisponível), força modo de seleção.
  const mustPick = connected && (!adAccountId || accountUnavailable);
  const showAccountList = switching || mustPick;

  return (
    <AppShell
      title="Integrações"
      subtitle="Conecte fontes de dados à sua plataforma de inteligência"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
          ← Voltar ao dashboard
        </Link>

        <section className="surface-panel p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Anúncios
              </div>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">Meta Ads</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sincroniza campanhas, métricas e resultados automaticamente.
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                connected
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card/40 text-muted-foreground"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  connected
                    ? "bg-primary shadow-[0_0_10px_var(--primary)]"
                    : "bg-muted-foreground"
                }`}
              />
              {connected ? "Conectado" : "Não conectado"}
            </span>
          </div>

          {connected && (
            <div className="mt-6 space-y-4">
              {accountUnavailable && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    A conta <span className="font-medium">{accountName ?? adAccountId}</span>{" "}
                    não está mais disponível na Meta (removida ou sem acesso). Escolha outra
                    conta abaixo ou atualize a lista.
                  </div>
                </div>
              )}
              <div className="rounded-lg border border-border bg-card/40 p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Conta atualmente conectada
                </div>
                {adAccountId ? (
                  <>
                    <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="size-4 text-primary" />
                      {accountName ?? "Conta sem nome"}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{adAccountId}</div>
                  </>
                ) : (
                  <div className="mt-1 text-sm text-amber-400">
                    Nenhuma conta selecionada — escolha uma abaixo para começar.
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  Última sincronização:{" "}
                  {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString("pt-BR") : "—"}
                </div>
              </div>

              {showAccountList && (
                <div className="rounded-lg border border-border bg-card/40 p-4">
                  <div className="text-sm font-medium">
                    {mustPick ? "Selecione uma conta" : "Trocar de conta"}
                  </div>
                  <ul className="mt-3 space-y-2">
                    {accounts.map((a) => (
                      <li key={a.id}>
                        <button
                          onClick={() => select.mutate(a.id)}
                          disabled={select.isPending}
                          className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background/40 p-3 text-left text-sm hover:bg-card/60 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <div>
                            <div className="font-medium">{a.name}</div>
                            <div className="text-xs text-muted-foreground">{a.id}</div>
                          </div>
                          {select.isPending ? (
                            <Loader2 className="size-4 animate-spin text-primary" />
                          ) : adAccountId === a.id ? (
                            <CheckCircle2 className="size-4 text-primary" />
                          ) : null}
                        </button>
                      </li>
                    ))}
                    {accounts.length === 0 && (
                      <li className="text-xs text-muted-foreground">
                        Nenhuma conta disponível. Reconecte a Meta para atualizar a lista.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => syncNow.mutate()}
                  disabled={syncNow.isPending || !adAccountId}
                >
                  {syncNow.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Sincronizar agora
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSwitching((v) => !v)}
                  disabled={accounts.length === 0}
                >
                  <RotateCcw className="mr-2 size-4" />
                  {switching ? "Cancelar troca" : "Trocar conta"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => connect.mutate()}
                  disabled={connect.isPending}
                >
                  {connect.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Plug className="mr-2 size-4" />
                  )}
                  Reconectar Meta
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Desconectar a Meta? Será necessário reconectar para usar a plataforma."))
                      disc.mutate();
                  }}
                  disabled={disc.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  {disc.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Unplug className="mr-2 size-4" />
                  )}
                  Desconectar Meta
                </Button>
              </div>
            </div>
          )}

          {!connected && (
            <div className="mt-6">
              <Button
                onClick={() => connect.mutate()}
                disabled={connect.isPending}
                className="h-11 px-6"
              >
                {connect.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Conectar Meta Ads
              </Button>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
