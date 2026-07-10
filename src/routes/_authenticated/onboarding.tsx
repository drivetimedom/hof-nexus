import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  getOnboardingStatus,
  startMetaOAuth,
  selectAdAccount,
  syncMyMetrics,
  completeOnboarding,
} from "@/lib/meta.functions";
import { CheckCircle2, Circle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({
  meta_connected: z.string().optional(),
  meta_error: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: searchSchema,
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/onboarding" });
  const qc = useQueryClient();
  const getStatus = useServerFn(getOnboardingStatus);
  const startOAuth = useServerFn(startMetaOAuth);
  const selectAcc = useServerFn(selectAdAccount);
  const sync = useServerFn(syncMyMetrics);
  const complete = useServerFn(completeOnboarding);

  const status = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => getStatus(),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
  });

  useEffect(() => {
    if (search.meta_connected) {
      toast.success("Meta conectada. Agora escolha sua conta de anúncios.");
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
      status.refetch();
      navigate({ to: "/onboarding", search: {}, replace: true });
    }
    if (search.meta_error) {
      toast.error(`Erro ao conectar Meta: ${search.meta_error}`);
      navigate({ to: "/onboarding", search: {}, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.meta_connected, search.meta_error]);

  const s = status.data;
  const connected = !!s?.meta?.connected;
  const adAccountId = s?.meta && "adAccountId" in s.meta ? s.meta.adAccountId ?? null : null;
  const availableAccounts =
    s?.meta && "availableAccounts" in s.meta ? s.meta.availableAccounts ?? [] : [];
  const accountUnavailable =
    s?.meta && "accountUnavailable" in s.meta ? !!s.meta.accountUnavailable : false;
  const onboardingDone = !!s?.onboardingCompleted;

  // Já concluiu e tem conta válida: vai pro dashboard.
  useEffect(() => {
    if (status.data && connected && adAccountId && onboardingDone && !accountUnavailable) {
      navigate({ to: "/dashboard" });
    }
  }, [status.data, connected, adAccountId, onboardingDone, accountUnavailable, navigate]);

  const connectMutation = useMutation({
    mutationFn: async () => startOAuth(),
    onSuccess: ({ authUrl }) => {
      window.location.href = authUrl;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [finalizing, setFinalizing] = useState<string | null>(null);

  const finalizeMutation = useMutation({
    mutationFn: async (id: string) => {
      setFinalizing(id);
      await selectAcc({ data: { adAccountId: id } });
      // Sincronização inicial não-bloqueante para o redirect — mas aguardamos
      // para que o dashboard já abra com dados quando possível.
      try {
        await sync();
      } catch (e) {
        // sync pode falhar (sem permissão/insights vazios); seguimos.
        console.error("[onboarding] sync inicial falhou", e);
      }
      await complete();
    },
    onSuccess: () => {
      toast.success("Tudo pronto. Bem-vindo ao HOF Circle Analytics.");
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => {
      setFinalizing(null);
      toast.error(e.message);
    },
  });

  const stepConnect = connected;
  const stepSelect = connected && !!adAccountId;
  const steps = [
    { id: 1, label: "Conectar Meta Ads", done: stepConnect },
    { id: 2, label: "Selecionar conta de anúncios", done: stepSelect },
    { id: 3, label: "Concluir onboarding", done: stepSelect && onboardingDone },
  ];

  return (
    <AppShell
      title="Bem-vindo ao HOF Circle Analytics"
      subtitle="Vamos configurar sua plataforma para começar a gerar insights estratégicos."
    >
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {!connected && (
            <StepCard
              index={1}
              title="Conecte sua conta Meta"
              description="Autorize o acesso à sua conta Meta para listarmos suas contas de anúncios."
            >
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="h-11 px-6"
              >
                {connectMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 size-4" />
                )}
                Conectar Meta Ads
              </Button>
            </StepCard>
          )}

          {connected && !adAccountId && (
            <SelectAccountStep
              accounts={availableAccounts}
              finalizing={finalizing}
              loading={finalizeMutation.isPending}
              onPick={(id) => finalizeMutation.mutate(id)}
            />
          )}

          {connected && adAccountId && !onboardingDone && (
            <StepCard
              index={3}
              title="Finalizando configuração"
              description="Sincronizando seus dados e concluindo o onboarding…"
            >
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Aguarde um instante.
              </div>
            </StepCard>
          )}
        </div>

        <aside className="surface-panel h-fit p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Checklist de configuração
          </div>
          <h3 className="mt-1 font-display text-base font-semibold tracking-tight">
            Sua jornada inicial
          </h3>
          <ul className="mt-5 space-y-3">
            {steps.map((st) => (
              <li key={st.id} className="flex items-start gap-3 text-sm">
                {st.done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={st.done ? "text-foreground" : "text-muted-foreground"}>
                  {st.label}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}

function StepCard({
  index,
  title,
  description,
  children,
}: {
  index: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-panel p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--gradient-accent)] text-sm font-semibold text-primary-foreground">
          {index}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SelectAccountStep({
  accounts,
  finalizing,
  loading,
  onPick,
}: {
  accounts: Array<{ id: string; name: string; account_id?: string; currency?: string }>;
  finalizing: string | null;
  loading: boolean;
  onPick: (id: string) => void;
}) {
  if (accounts.length === 0) {
    return (
      <StepCard
        index={2}
        title="Nenhuma conta de anúncios encontrada"
        description="Não localizamos contas vinculadas ao seu usuário Meta."
      >
        <p className="text-sm text-muted-foreground">
          Verifique se você possui acesso a uma conta de anúncios no Business Manager e tente
          reconectar.
        </p>
      </StepCard>
    );
  }
  return (
    <StepCard
      index={2}
      title="Selecione a conta de anúncios"
      description="Escolha qual conta você quer monitorar. Iniciaremos a sincronização automaticamente."
    >
      <ul className="space-y-2">
        {accounts.map((a) => {
          const isFinalizing = finalizing === a.id && loading;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onPick(a.id)}
                disabled={loading}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card/40 p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ID: {a.id}
                    {a.currency ? ` · ${a.currency}` : ""}
                  </div>
                </div>
                {isFinalizing ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <span className="text-xs text-muted-foreground">Selecionar →</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </StepCard>
  );
}
