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
import { CheckCircle2, Circle, ExternalLink, Loader2, Sparkles } from "lucide-react";
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
  });

  useEffect(() => {
    if (search.meta_connected) {
      toast.success("Meta conectada com sucesso.");
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
    }
    if (search.meta_error) {
      toast.error(`Erro ao conectar Meta: ${search.meta_error}`);
    }
  }, [search.meta_connected, search.meta_error, qc]);

  const connectMutation = useMutation({
    mutationFn: async () => startOAuth(),
    onSuccess: ({ authUrl }) => {
      window.location.href = authUrl;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [picked, setPicked] = useState<string>("");
  const selectMutation = useMutation({
    mutationFn: async (id: string) => selectAcc({ data: { adAccountId: id } }),
    onSuccess: () => {
      toast.success("Conta selecionada.");
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const syncMutation = useMutation({
    mutationFn: async () => sync(),
    onSuccess: ({ days }) => toast.success(`Sincronização concluída (${days} dias).`),
    onError: (e: Error) => toast.error(e.message),
  });

  const finishMutation = useMutation({
    mutationFn: async () => complete(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const s = status.data;
  const connected = !!s?.meta?.connected;
  const selected = connected && !!s?.meta && "adAccountId" in s.meta && !!s.meta.adAccountId;
  const synced = connected && !!s?.meta && "lastSyncedAt" in s.meta && !!s.meta.lastSyncedAt;
  const steps = [
    { id: 1, label: "Conectar Meta Ads", done: connected },
    { id: 2, label: "Selecionar conta de anúncios", done: selected },
    { id: 3, label: "Configurar sincronização", done: synced },
    { id: 4, label: "Concluir onboarding", done: false },
  ];

  return (
    <AppShell title="Bem-vindo ao HOF Circle Analytics" subtitle="Vamos configurar sua plataforma para começar a gerar insights estratégicos.">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main flow */}
        <div className="space-y-6">
          <Step1 connected={connected} loading={connectMutation.isPending} onConnect={() => connectMutation.mutate()} />
          {connected && (
            <Step2
              accounts={
                s?.meta && "availableAccounts" in s.meta ? s.meta.availableAccounts : []
              }
              selectedId={s?.meta && "adAccountId" in s.meta ? s.meta.adAccountId : null}
              picked={picked}
              onPick={setPicked}
              onConfirm={() => picked && selectMutation.mutate(picked)}
              loading={selectMutation.isPending}
            />
          )}
          {selected && (
            <Step3
              lastSyncedAt={s?.meta && "lastSyncedAt" in s.meta ? s.meta.lastSyncedAt : null}
              loading={syncMutation.isPending}
              onSync={() => syncMutation.mutate()}
            />
          )}
          {synced && (
            <Step4 loading={finishMutation.isPending} onFinish={() => finishMutation.mutate()} />
          )}
        </div>

        {/* Checklist */}
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

function Step1({ connected, loading, onConnect }: { connected: boolean; loading: boolean; onConnect: () => void }) {
  return (
    <StepCard
      index={1}
      title="Meta Ads"
      description="Conecte sua conta Meta para sincronizar campanhas, métricas e resultados automaticamente."
    >
      {connected ? (
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-2 text-sm">
          <CheckCircle2 className="size-4 text-primary" /> Conta Meta conectada
        </div>
      ) : (
        <Button onClick={onConnect} disabled={loading} className="h-11 px-6">
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ExternalLink className="mr-2 size-4" />}
          Conectar Meta Ads
        </Button>
      )}
    </StepCard>
  );
}

function Step2({
  accounts,
  selectedId,
  picked,
  onPick,
  onConfirm,
  loading,
}: {
  accounts: Array<{ id: string; name: string; account_id?: string; currency?: string }>;
  selectedId: string | null | undefined;
  picked: string;
  onPick: (id: string) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (accounts.length === 0) {
    return (
      <StepCard
        index={2}
        title="Selecione a conta de anúncios"
        description="Não encontramos nenhuma conta de anúncios vinculada ao seu usuário Meta."
      >
        <p className="text-sm text-muted-foreground">
          Verifique se você possui acesso a uma conta de anúncios no Business Manager.
        </p>
      </StepCard>
    );
  }
  return (
    <StepCard
      index={2}
      title="Selecione a conta de anúncios"
      description="Escolha qual conta de anúncios você quer monitorar nesta plataforma."
    >
      <ul className="space-y-2">
        {accounts.map((a) => {
          const active = (picked || selectedId) === a.id;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onPick(a.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-left transition ${
                  active
                    ? "border-primary/60 bg-primary/5"
                    : "border-border bg-card/40 hover:bg-card/60"
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ID: {a.id}
                    {a.currency ? ` · ${a.currency}` : ""}
                  </div>
                </div>
                {active && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-5">
        <Button
          onClick={onConfirm}
          disabled={!picked || loading || picked === selectedId}
          className="h-10 px-5"
        >
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {selectedId && picked === selectedId ? "Conta confirmada" : "Confirmar seleção"}
        </Button>
      </div>
    </StepCard>
  );
}

function Step3({ lastSyncedAt, loading, onSync }: { lastSyncedAt: string | null; loading: boolean; onSync: () => void }) {
  return (
    <StepCard
      index={3}
      title="Configurar sincronização"
      description="Vamos buscar os últimos 30 dias de métricas. Depois disso, a plataforma atualiza automaticamente a cada hora."
    >
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={onSync} disabled={loading} className="h-10 px-5">
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          {lastSyncedAt ? "Sincronizar novamente" : "Iniciar sincronização"}
        </Button>
        {lastSyncedAt && (
          <span className="text-xs text-muted-foreground">
            Última sincronização: {new Date(lastSyncedAt).toLocaleString("pt-BR")}
          </span>
        )}
      </div>
    </StepCard>
  );
}

function Step4({ loading, onFinish }: { loading: boolean; onFinish: () => void }) {
  return (
    <StepCard
      index={4}
      title="Pronto para decolar"
      description="Tudo configurado. Acesse o dashboard e veja seus indicadores em tempo real."
    >
      <Button onClick={onFinish} disabled={loading} className="h-11 px-6">
        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
        Concluir onboarding
      </Button>
    </StepCard>
  );
}
