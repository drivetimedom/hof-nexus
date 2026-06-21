import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/routes/auth";
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERIODS, type Period } from "@/lib/mock-data";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/campaigns", label: "Campanhas", icon: BarChart3 },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/reports", label: "Relatórios", icon: FileText },
] as const;

export function AppShell({
  children,
  period,
  onPeriodChange,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  period?: Period;
  onPeriodChange?: (p: Period) => void;
  title: string;
  subtitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string>("");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada.");
    navigate({ to: "/auth" });
  }

  const initials = email ? email.slice(0, 2).toUpperCase() : "HC";

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="hero-glow pointer-events-none fixed inset-x-0 top-0 h-[420px]" />

      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <BrandMark />
          <div className="min-w-0">
            <div className="font-display text-sm font-semibold tracking-tight">HOF Circle</div>
            <div className="text-[11px] text-muted-foreground">Analytics</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-card text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                }`}
              >
                <item.icon className={`size-4 ${active ? "text-primary" : ""}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {active && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="surface-glass flex items-center gap-3 rounded-lg p-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--gradient-accent)] text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{email || "Membro HOF"}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Plano Black</div>
            </div>
            <button onClick={signOut} className="rounded-md p-1.5 text-muted-foreground hover:bg-card hover:text-foreground" title="Sair">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-sidebar lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <div className="flex items-center gap-3">
                <BrandMark />
                <div className="font-display text-sm font-semibold tracking-tight">HOF Circle</div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-card hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 p-3">
              {NAV.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      active ? "bg-card text-foreground" : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                    }`}
                  >
                    <item.icon className={`size-4 ${active ? "text-primary" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border p-3">
              <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-card hover:text-foreground">
                <LogOut className="size-4" /> Sair
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main */}
      <div className="lg:pl-[248px]">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
            <button
              onClick={() => setOpen(true)}
              className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground lg:hidden"
            >
              <Menu className="size-4" />
            </button>

            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <h1 className="truncate font-display text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
                {subtitle && <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {period && onPeriodChange && (
                  <PeriodSelector value={period} onChange={onPeriodChange} />
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden h-9 items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 text-sm transition hover:bg-card/80 sm:flex">
                      <div className="grid size-6 place-items-center rounded-md bg-[var(--gradient-accent)] text-[10px] font-semibold text-primary-foreground">
                        {initials}
                      </div>
                      <span className="max-w-[140px] truncate text-xs text-muted-foreground">{email || "Membro"}</span>
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-border bg-popover">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">{email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-sm">
                      <Settings className="mr-2 size-4" /> Preferências
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-sm">
                      <LogOut className="mr-2 size-4" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 border-border bg-card text-xs font-medium hover:bg-card/80">
          {PERIODS.find((p) => p.id === value)?.label}
          <ChevronDown className="ml-1 size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-border bg-popover">
        {PERIODS.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => onChange(p.id)} className="text-sm">
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
