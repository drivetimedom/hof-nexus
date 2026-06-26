import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ReportView } from "@/components/report-view";
import { Button } from "@/components/ui/button";
import { getPublicReport } from "@/lib/reports.functions";
import { Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/r/$token")({
  head: () => ({
    meta: [
      { title: "Relatório de Performance · HOF Circle Analytics" },
      {
        name: "description",
        content:
          "Relatório executivo de performance em tráfego pago, gerado pela plataforma HOF Circle Analytics.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PublicReportPage,
});

function PublicReportPage() {
  const { token } = Route.useParams();
  const fetchPublic = useServerFn(getPublicReport);
  const q = useQuery({
    queryKey: ["public-report", token],
    queryFn: () => fetchPublic({ data: { token } }),
    retry: false,
  });

  if (q.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div className="surface-panel max-w-md p-10">
          <h1 className="font-display text-xl font-semibold">Relatório indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este link expirou ou foi desativado pelo autor do relatório.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="report-toolbar sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[920px] items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              HOF Circle Analytics
            </div>
            <div className="truncate text-sm font-medium">{q.data.title ?? "Relatório executivo"}</div>
          </div>
          <Button size="sm" className="h-9" onClick={() => window.print()}>
            <Download className="size-3.5" /> Baixar PDF
          </Button>
        </div>
      </header>
      <main className="report-shell px-4 pt-8">
        <ReportView snapshot={q.data.snapshot} />
      </main>
      <footer className="mx-auto mt-10 max-w-[920px] px-4 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Gerado por HOF Circle Analytics · Inteligência estratégica em tráfego pago
      </footer>
    </div>
  );
}
