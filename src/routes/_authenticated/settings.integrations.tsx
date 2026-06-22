import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  getOnboardingStatus,
  startMetaOAuth,
  disconnectMeta,
  refreshAdAccounts,
  selectAdAccount,
  syncMyMetrics,
} from "@/lib/meta.functions";
import { CheckCircle2, Loader2, RefreshCw, Unplug, Plug, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/settings/integrations")({
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const qc = useQueryClient();
  const getStatus = useServerFn(getOnboardingStatus);
  const startOAuth = useServerFn(startMetaOAuth);
  const disconnect = useServerFn(disconnectMeta);
  const refresh = useServerFn(refreshAdAccounts);
  const selectAcc = useServerFn(selectAdAccount);
  const sync = useServerFn(syncMyMetrics);

  const status = useQuery({ queryKey: ["onboarding-status"], queryFn: () => getStatus() });
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
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const refreshAcc = useMutation({
    mutationFn: async () => refresh(),
    onSuccess: () => {
      toast.success("Contas atualizadas.");
      setSwitching(true);
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const select = useMutation({
    mutationFn: async (id: string) => selectAcc({ data: { adAccountId: id } }),
    onSuccess: () => {
      toast.success("Conta atualizada.");
      setSwitching(false);
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const syncNow = useMutation({
    mutationFn: async () => sync(),
    onSuccess: ({ days }) => toast.success(`Sincronizado (${days} dias).`),
    onError: (e: Error) => toast.error(e.message),
  });

  const meta = status.data?.meta;
  const connected = !!meta?.connected;

  return (
    <AppShell title="Integrações" subtitle="Conecte fontes de dados à sua plataforma de inteligência">
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
                className={`size-1.5 rounded-full ${connected ? "bg-primary shadow-[0_0_10px_var(--primary)]" : "bg-muted-foreground"}`}
              />
              {connected ? "Conectado" : "Não conectado"}
            </span>
          </div>

          {connected && meta && "adAccountId" in meta && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-border bg-card/40 p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Conta selecionada
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-primary" />
                  {meta.accountName ?? "—"}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {meta.adAccountId ?? "Nenhuma conta selecionada"}
                </div>
                {meta.lastSyncedAt && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Última sincronização: {new Date(meta.lastSyncedAt).toLocaleString("pt-BR")}
                  </div>
                )}
              </div>

              {switching && (
                <div className="rounded-lg border border-border bg-card/40 p-4">
                  <div className="text-sm font-medium">Trocar de conta</div>
                  <ul className="mt-3 space-y-2">
                    {meta.availableAccounts.map((a) => (
                      <li key={a.id}>
                        <button
                          onClick={() => select.mutate(a.id)}
                          disabled={select.isPending}
                          className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background/40 p-3 text-left text-sm hover:bg-card/60"
                        >
                          <div>
                            <div className="font-medium">{a.name}</div>
                            <div className="text-xs text-muted-foreground">{a.id}</div>
                          </div>
                          {meta.adAccountId === a.id && <CheckCircle2 className="size-4 text-primary" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => syncNow.mutate()} disabled={syncNow.isPending}>
                  {syncNow.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
                  Sincronizar agora
                </Button>
                <Button variant="outline" onClick={() => refreshAcc.mutate()} disabled={refreshAcc.isPending}>
                  {refreshAcc.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RotateCcw className="mr-2 size-4" />}
                  Trocar conta
                </Button>
                <Button variant="outline" onClick={() => connect.mutate()} disabled={connect.isPending}>
                  <Plug className="mr-2 size-4" /> Reconectar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja desconectar a Meta?")) disc.mutate();
                  }}
                  disabled={disc.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Unplug className="mr-2 size-4" /> Desconectar
                </Button>
              </div>
            </div>
          )}

          {!connected && (
            <div className="mt-6">
              <Button onClick={() => connect.mutate()} disabled={connect.isPending} className="h-11 px-6">
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
