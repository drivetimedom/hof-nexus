import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyCampaigns } from "@/lib/meta.functions";
import { TableSkeleton } from "@/components/skeletons";
import { CampaignActions } from "@/components/campaign-actions";

type CampaignStatus = "excelente" | "atencao" | "critico" | "pausada";

const STATUS_LABEL: Record<CampaignStatus, string> = {
  excelente: "Excelente",
  atencao: "Atenção",
  critico: "Crítico",
  pausada: "Pausada",
};

const STATUS_STYLES: Record<CampaignStatus, { dot: string; pill: string }> = {
  excelente: { dot: "bg-emerald-400 shadow-[0_0_10px_rgb(52_211_153)]", pill: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
  atencao: { dot: "bg-amber-400 shadow-[0_0_10px_rgb(251_191_36)]", pill: "border-amber-500/20 bg-amber-500/10 text-amber-400" },
  critico: { dot: "bg-rose-400 shadow-[0_0_10px_rgb(244_114_114)]", pill: "border-rose-500/20 bg-rose-500/10 text-rose-400" },
  pausada: { dot: "bg-muted-foreground/60", pill: "border-white/10 bg-white/5 text-muted-foreground" },
};

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtBRL2 = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number) => Math.round(n).toLocaleString("pt-BR");

export function CampaignsTable({ limit, days = 30 }: { limit?: number; days?: number }) {
  const fetchCampaigns = useServerFn(getMyCampaigns);
  const query = useQuery({
    queryKey: ["campaigns", days],
    queryFn: () => fetchCampaigns({ data: { days } }),
  });

  const all = query.data?.campaigns ?? [];
  const data = limit ? all.slice(0, limit) : all;

  return (
    <div className="surface-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-glass-border px-5 py-4 sm:px-7">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-t2">Campanhas</div>
          <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-t1">Operação ativa</h3>
        </div>
        <span className="text-xs text-t2">
          {query.isLoading ? "carregando…" : `${all.length} campanhas`}
        </span>
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={limit ?? 5} />
      ) : query.isError ? (
        <div className="px-7 py-10 text-sm text-t2">
          Não foi possível carregar as campanhas da Meta.
          <div className="mt-1 text-xs text-rose-400">{(query.error as Error).message}</div>
        </div>
      ) : data.length === 0 ? (
        <div className="px-7 py-10 text-sm text-t2">
          Nenhuma campanha encontrada na conta selecionada para o período.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border text-left text-[11px] uppercase tracking-wider text-t2">
                  <th className="px-7 py-3 font-medium">Campanha</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Invest.</th>
                  <th className="px-4 py-3 text-right font-medium">Impressões</th>
                  <th className="px-4 py-3 text-right font-medium">Alcance</th>
                  <th className="px-4 py-3 text-right font-medium">Cliques</th>
                  <th className="px-4 py-3 text-right font-medium">CTR</th>
                  <th className="px-4 py-3 text-right font-medium">CPC</th>
                  <th className="px-4 py-3 text-right font-medium">Leads</th>
                  <th className="px-4 py-3 text-right font-medium">CPL</th>
                  <th className="px-4 py-3 text-right font-medium">Conv.</th>
                  <th className="px-7 py-3 text-right font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => {
                  const s = STATUS_STYLES[c.status as CampaignStatus];
                  return (
                    <tr key={c.id} className="border-b border-glass-border/60 transition last:border-0 hover:bg-glass-strong">
                      <td className="px-7 py-4">
                        <div className="font-medium text-t1">{c.name}</div>
                        <div className="mt-0.5 text-[11px] text-t3">Meta Ads</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.pill}`}>
                          <span className={`size-1.5 rounded-full ${s.dot}`} />
                          {STATUS_LABEL[c.status as CampaignStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-t1">{fmtBRL(c.spend)}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-t2">{fmtInt(c.impressions)}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-t2">{fmtInt(c.reach)}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-t2">{fmtInt(c.clicks)}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-t2">{c.ctr.toFixed(2)}%</td>
                      <td className="px-4 py-4 text-right tabular-nums text-t2">{fmtBRL2(c.cpc)}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-t1">{fmtInt(c.leads)}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-t2">{fmtBRL2(c.cpl)}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-t1">{fmtInt(c.purchases)}</td>
                      <td className="px-7 py-4 text-right">
                        <span className={`font-semibold tabular-nums ${c.roas >= 8 ? "text-emerald-400" : c.roas >= 4 ? "text-t1" : "text-rose-400"}`}>
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
          <div className="divide-y divide-glass-border md:hidden">
            {data.map((c) => {
              const s = STATUS_STYLES[c.status as CampaignStatus];
              return (
                <div key={c.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-t1">{c.name}</div>
                      <div className="mt-0.5 text-[11px] text-t3">Meta Ads</div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${s.pill}`}>
                      <span className={`size-1.5 rounded-full ${s.dot}`} />
                      {STATUS_LABEL[c.status as CampaignStatus]}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                    <Stat label="Invest." value={fmtBRL(c.spend)} />
                    <Stat label="Impr." value={fmtInt(c.impressions)} />
                    <Stat label="Alcance" value={fmtInt(c.reach)} />
                    <Stat label="Cliques" value={fmtInt(c.clicks)} />
                    <Stat label="CTR" value={`${c.ctr.toFixed(2)}%`} />
                    <Stat label="CPC" value={fmtBRL2(c.cpc)} />
                    <Stat label="Leads" value={fmtInt(c.leads)} />
                    <Stat label="CPL" value={fmtBRL2(c.cpl)} />
                    <Stat label="ROAS" value={`${c.roas.toFixed(2)}x`} accent={c.roas >= 8} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-t2">{label}</div>
      <div className={`mt-0.5 tabular-nums ${accent ? "font-semibold text-emerald-400" : "text-t1"}`}>{value}</div>
    </div>
  );
}
