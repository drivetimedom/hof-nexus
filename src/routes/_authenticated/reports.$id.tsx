import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ReportView } from "@/components/report-view";
import { Button } from "@/components/ui/button";
import { getReport, generateReport } from "@/lib/reports.functions";
import { ArrowLeft, Download, Link2, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports/$id")({
  component: ReportViewerPage,
});

function ReportViewerPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchReport = useServerFn(getReport);
  const runGenerate = useServerFn(generateReport);

  const q = useQuery({
    queryKey: ["report", id],
    queryFn: () => fetchReport({ data: { id } }),
  });

  const regenerate = useMutation({
    mutationFn: () => {
      const snap = q.data!.snapshot;
      return runGenerate({
        data: {
          preset: snap.period.preset,
          startDate: snap.period.startDate,
          endDate: snap.period.endDate,
          title: q.data!.title ?? undefined,
        },
      });
    },
    onSuccess: (res) => {
      toast.success("Novo relatório gerado.");
      navigate({ to: "/reports/$id", params: { id: res.id } });
    },
    onError: (err: unknown) => toast.error((err as Error).message || "Falha ao regerar."),
  });

  if (q.isLoading) {
    return (
      <AppShell title="Relatório">
        <div className="grid h-[60vh] place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }
  if (q.isError || !q.data) {
    return (
      <AppShell title="Relatório">
        <div className="surface-panel p-10 text-center text-sm text-muted-foreground">
          Não foi possível carregar este relatório.
        </div>
      </AppShell>
    );
  }

  const shareUrl = `${window.location.origin}/r/${q.data.token}`;

  return (
    <AppShell title="Relatório executivo" subtitle={q.data.title ?? undefined}>
      <div className="report-toolbar surface-panel mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Voltar
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              toast.success("Link público copiado.");
            }}
          >
            <Link2 className="size-3.5" /> Compartilhar link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="size-3.5" />
            )}
            Gerar novamente
          </Button>
          <Button size="sm" className="h-9" onClick={() => window.print()}>
            <Download className="size-3.5" /> Baixar PDF
          </Button>
        </div>
      </div>

      <div className="report-shell">
        <ReportView snapshot={q.data.snapshot} />
      </div>
    </AppShell>
  );
}
