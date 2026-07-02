import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/routes/auth";
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  FileText,
  Filter,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Users as UsersIcon,
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

const BASE_NAV = [
  { to: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/campaigns", label: "Campanhas", icon: BarChart3 },
  { to: "/funnel", label: "Funil", icon: Filter },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/reports", label: "Relatórios", icon: FileText },
  { to: "/settings/integrations", label: "Integrações", icon: Settings },
] as const;

const ADMIN_NAV = [
  { to: "/settings/users", label: "Usuários", icon: UsersIcon },
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
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setEmail(data.user?.email ?? "");
      if (data.user) {
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();
        setIsAdmin(!!role);
      }
    });
  }, []);

  const NAV = isAdmin ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV;

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada.");
    navigate({ to: "/auth" });
  }

  const initials = email ? email.slice(0, 2).toUpperCase() : "HC";

  return (
    <div className="relative min-h-screen bg-[#0C0A08] text-t1">
      <div className="hero-glow pointer-events-none fixed inset-x-0 top-0 h-[420px]" />

      {/* Sidebar — desktop */}
      <aside data-app-shell="sidebar" className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-glass-border bg-[#0C0A08] backdrop-blur-xl transition-ea lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-glass-border px-5">
          <BrandMark className="h-11 sm:h-12" />
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-ea ${
                  active
                    ? "bg-glass-strong text-t1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-t2 hover:bg-glass hover:text-t1"
                }`}
              >
                <item.icon className={`size-4 ${active ? "text-primary" : ""}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {active && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-glass-border p-3">
          <div className="surface-glass flex items-center gap-3 p-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--gradient-accent)] text-xs font-semibold text-[var(--bg)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-t1">{email || "Membro HOF"}</div>
              <div className="text-[10px] uppercase tracking-wider text-t3">Plano Black</div>
            </div>
            <button onClick={signOut} className="rounded-md p-1.5 text-t2 hover:bg-glass hover:text-t1" title="Sair">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-[#0C0A08]/80 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-glass-border bg-[#0C0A08] lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-glass-border px-5">
              <div className="flex items-center">
                <BrandMark className="h-11" />
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-t2 hover:bg-glass hover:text-t1">
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
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-ea ${
                      active ? "bg-glass-strong text-t1" : "text-t2 hover:bg-glass hover:text-t1"
                    }`}
                  >
                    <item.icon className={`size-4 ${active ? "text-primary" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-glass-border p-3">
              <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-t2 hover:bg-glass hover:text-t1">
                <LogOut className="size-4" /> Sair
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main */}
      <div className="lg:pl-[248px]">
        {/* Header */}
        <header data-app-shell="header" className="app-header sticky top-0 z-30 border-b border-glass-border bg-[#0C0A08]/80 backdrop-blur-xl transition-ea">
          <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-8">
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              className="grid size-10 shrink-0 place-items-center rounded-[var(--r)] border border-glass-border bg-glass text-t2 transition-ea hover:border-glass-border-hover hover:text-t1 lg:hidden"
            >
              <Menu className="size-4" />
            </button>

            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3">
              <div className="min-w-0">
                <h1 className="truncate font-display text-sm font-semibold tracking-tight text-t1 sm:text-lg">{title}</h1>
                {subtitle && <p className="hidden truncate text-xs text-t2 sm:block">{subtitle}</p>}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {period && onPeriodChange && (
                  <PeriodSelector value={period} onChange={onPeriodChange} />
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden h-9 items-center gap-2.5 rounded-[var(--r)] border border-glass-border bg-glass px-2.5 text-sm transition-ea hover:border-glass-border-hover hover:bg-glass-strong sm:flex">
                      <div className="grid size-6 place-items-center rounded-md bg-[var(--gradient-accent)] text-[10px] font-semibold text-[var(--bg)]">
                        {initials}
                      </div>
                      <span className="max-w-[140px] truncate text-xs text-t2">{email || "Membro"}</span>
                      <ChevronDown className="size-3.5 text-t3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-glass-border bg-[#0C0A08]/95 backdrop-blur-xl">
                    <DropdownMenuLabel className="text-xs text-t3">{email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="text-sm">
                      <Link to="/settings/preferences">
                        <Settings className="mr-2 size-4" /> Preferências
                      </Link>
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

        <main className="mx-auto w-full max-w-[1400px] px-3 py-5 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 rounded-[var(--r)] border-glass-border bg-glass px-2.5 text-xs font-medium text-t2 transition-ea hover:border-glass-border-hover hover:bg-glass-strong hover:text-t1 sm:px-3">
          {PERIODS.find((p) => p.id === value)?.label}
          <ChevronDown className="ml-1 size-3.5 text-t3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-glass-border bg-[#0C0A08]/95 backdrop-blur-xl">
        {PERIODS.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => onChange(p.id)} className="text-sm">
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
