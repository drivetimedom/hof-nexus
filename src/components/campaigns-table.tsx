import { CAMPAIGNS, STATUS_LABEL, type CampaignStatus } from "@/lib/mock-data";

const STATUS_STYLES: Record<CampaignStatus, { dot: string; pill: string }> = {
  excelente: { dot: "bg-emerald-400 shadow-[0_0_10px_rgb(52_211_153)]", pill: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
  atencao: { dot: "bg-amber-400 shadow-[0_0_10px_rgb(251_191_36)]", pill: "border-amber-500/20 bg-amber-500/10 text-amber-400" },
  critico: { dot: "bg-rose-400 shadow-[0_0_10px_rgb(244_114_114)]", pill: "border-rose-500/20 bg-rose-500/10 text-rose-400" },
  pausada: { dot: "bg-muted-foreground/60", pill: "border-white/10 bg-white/5 text-muted-foreground" },
};

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function CampaignsTable({ limit }: { limit?: number }) {
  const data = limit ? CAMPAIGNS.slice(0, limit) : CAMPAIGNS;

  return (
    <div className="surface-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Campanhas</div>
          <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">Operação ativa</h3>
        </div>
        <span className="text-xs text-muted-foreground">{data.length} campanhas</span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-7 py-3 font-medium">Campanha</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Investimento</th>
              <th className="px-4 py-3 text-right font-medium">Leads</th>
              <th className="px-4 py-3 text-right font-medium">CPL</th>
              <th className="px-4 py-3 text-right font-medium">Conv.</th>
              <th className="px-7 py-3 text-right font-medium">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => {
              const s = STATUS_STYLES[c.status];
              return (
                <tr key={c.id} className="border-b border-border/60 transition last:border-0 hover:bg-card/40">
                  <td className="px-7 py-4">
                    <div className="font-medium">{c.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{c.channel}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.pill}`}>
                      <span className={`size-1.5 rounded-full ${s.dot}`} />
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums">{fmtBRL(c.invest)}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{c.leads.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">R$ {c.cpl.toFixed(2).replace(".", ",")}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{c.conv.toLocaleString("pt-BR")}</td>
                  <td className="px-7 py-4 text-right">
                    <span className={`font-semibold tabular-nums ${c.roas >= 8 ? "text-emerald-400" : c.roas >= 4 ? "text-foreground" : "text-rose-400"}`}>
                      {c.roas.toFixed(2)}x
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-border md:hidden">
        {data.map((c) => {
          const s = STATUS_STYLES[c.status];
          return (
            <div key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{c.channel}</div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${s.pill}`}>
                  <span className={`size-1.5 rounded-full ${s.dot}`} />
                  {STATUS_LABEL[c.status]}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <Stat label="Invest." value={fmtBRL(c.invest)} />
                <Stat label="Leads" value={c.leads.toLocaleString("pt-BR")} />
                <Stat label="CPL" value={`R$ ${c.cpl.toFixed(2).replace(".", ",")}`} />
                <Stat label="Conv." value={c.conv.toLocaleString("pt-BR")} />
                <Stat label="ROAS" value={`${c.roas.toFixed(2)}x`} accent={c.roas >= 8} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 tabular-nums ${accent ? "font-semibold text-emerald-400" : ""}`}>{value}</div>
    </div>
  );
}
