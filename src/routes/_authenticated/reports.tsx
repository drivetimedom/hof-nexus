import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { REPORTS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Download, FileText, Share2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell title="Relatórios" subtitle="Histórico e exportações da sua operação">
      <div className="surface-panel mb-8 grid grid-cols-1 gap-4 p-5 sm:grid-cols-3 sm:p-7">
        <Action
          icon={Plus}
          title="Gerar relatório"
          desc="Crie um snapshot executivo do período selecionado."
          cta="Novo relatório"
          onClick={() => toast.success("Relatório em preparação.")}
          primary
        />
        <Action
          icon={Download}
          title="Exportar PDF"
          desc="Baixe o relatório executivo atual em PDF de alta fidelidade."
          cta="Exportar"
          onClick={() => toast.info("Exportação iniciada.")}
        />
        <Action
          icon={Share2}
          title="Compartilhar"
          desc="Gere um link privado e seguro para compartilhar com sua equipe."
          cta="Gerar link"
          onClick={() => toast.success("Link copiado para a área de transferência.")}
        />
      </div>

      <div className="surface-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Histórico</div>
            <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">Relatórios recentes</h3>
          </div>
          <span className="text-xs text-muted-foreground">{REPORTS.length} arquivos</span>
        </div>
        <ul className="divide-y divide-border">
          {REPORTS.map((r) => (
            <li key={r.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-card/40 sm:px-7">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-card">
                <FileText className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.name}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {r.period} · gerado em {r.createdAt} · {r.size}
                </div>
              </div>
              <button
                onClick={() => toast.success("Download iniciado.")}
                className="hidden h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:bg-card/80 hover:text-foreground sm:flex"
              >
                <Download className="size-3.5" /> Baixar
              </button>
              <button
                onClick={() => toast.success("Download iniciado.")}
                className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground sm:hidden"
              >
                <Download className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

function Action({
  icon: Icon, title, desc, cta, onClick, primary,
}: { icon: typeof Plus; title: string; desc: string; cta: string; onClick: () => void; primary?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-5">
      <div className={`grid size-9 place-items-center rounded-lg border border-border ${primary ? "bg-[var(--gradient-accent)]" : "bg-card"}`}>
        <Icon className={`size-4 ${primary ? "text-primary-foreground" : "text-primary"}`} />
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</div>
      </div>
      <Button
        onClick={onClick}
        variant={primary ? "default" : "outline"}
        className={`mt-auto h-9 ${primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border-border bg-card hover:bg-card/80"}`}
      >
        {cta}
      </Button>
    </div>
  );
}
