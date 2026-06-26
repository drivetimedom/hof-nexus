import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import {
  adminCreateUser,
  adminGlobalStats,
  adminListAuditLog,
  adminListUsers,
  adminResetPassword,
  adminSetActive,
  adminSetRole,
  adminUpdateProfile,
  getMyRoles,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Shield,
  Link2,
  Target,
  Search,
  ShieldOff,
  ShieldCheck,
  Pencil,
  UserPlus,
  KeyRound,
  History,
  Copy,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings/users")({
  component: AdminUsersPage,
});

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  roles: string[];
  meta_connected: boolean;
  ad_account_id: string | null;
  last_synced_at: string | null;
};

function AdminUsersPage() {
  const qc = useQueryClient();

  const rolesQ = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getMyRoles(),
  });

  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminListUsers() as Promise<UserRow[]>,
    enabled: rolesQ.data?.isAdmin === true,
  });

  const statsQ = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminGlobalStats(),
    enabled: rolesQ.data?.isAdmin === true,
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [history, setHistory] = useState<UserRow | null>(null);
  const [resetting, setResetting] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);

  const setActive = useMutation({
    mutationFn: (vars: { targetUserId: string; is_active: boolean }) =>
      adminSetActive({ data: vars }),
    onSuccess: () => {
      toast.success("Status atualizado.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setRole = useMutation({
    mutationFn: (vars: { targetUserId: string; role: "admin" | "mentor" }) =>
      adminSetRole({ data: vars }),
    onSuccess: () => {
      toast.success("Papel atualizado.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const rows = usersQ.data ?? [];
    return rows
      .filter((u) => {
        if (roleFilter === "all") return true;
        return u.roles.includes(roleFilter);
      })
      .filter((u) => {
        if (statusFilter === "all") return true;
        return statusFilter === "active" ? u.is_active : !u.is_active;
      })
      .filter((u) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          (u.email ?? "").toLowerCase().includes(q) ||
          (u.full_name ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [usersQ.data, roleFilter, statusFilter, search]);

  if (rolesQ.isLoading) {
    return (
      <AppShell title="Usuários" subtitle="Painel administrativo">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </AppShell>
    );
  }

  if (!rolesQ.data?.isAdmin) {
    return (
      <AppShell title="Acesso restrito" subtitle="Esta área é exclusiva para administradores.">
        <div className="surface-glass rounded-xl p-8 text-center">
          <Shield className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Você não tem permissão para visualizar esta página.
          </p>
          <Link to="/dashboard">
            <Button variant="outline" className="mt-6">
              Voltar para o dashboard
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const stats = statsQ.data as
    | {
        total_mentors: number;
        total_admins: number;
        total_active: number;
        total_inactive: number;
        total_meta_connections: number;
        total_conversions: number;
        total_revenue: number;
        total_spend: number;
      }
    | null;

  return (
    <AppShell title="Usuários" subtitle="Gestão de mentorados e administradores">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total de mentorados"
          value={stats?.total_mentors ?? "—"}
          sub={`${stats?.total_active ?? 0} ativos · ${stats?.total_inactive ?? 0} inativos`}
        />
        <StatCard
          icon={Shield}
          label="Administradores"
          value={stats?.total_admins ?? "—"}
        />
        <StatCard
          icon={Link2}
          label="Contas Meta conectadas"
          value={stats?.total_meta_connections ?? "—"}
        />
        <StatCard
          icon={Target}
          label="Conversões globais"
          value={
            stats?.total_conversions != null
              ? Intl.NumberFormat("pt-BR").format(stats.total_conversions)
              : "—"
          }
          sub={
            stats?.total_revenue != null
              ? `R$ ${Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(
                  Number(stats.total_revenue),
                )} em receita`
              : undefined
          }
        />
      </div>

      {/* Action bar */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Gestão de contas
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <UserPlus className="size-4" />
          Novo usuário
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-4 surface-glass rounded-xl p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os papéis</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="mentor">Mentorado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 surface-glass overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-card/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Meta Ads</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usersQ.isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando usuários…
                  </td>
                </tr>
              )}
              {!usersQ.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={isAdmin ? "admin" : "mentor"}
                        onValueChange={(v) =>
                          setRole.mutate({
                            targetUserId: u.id,
                            role: v as "admin" | "mentor",
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mentor">Mentorado</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${
                          u.is_active
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            u.is_active ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        {u.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.meta_connected ? (
                        <>
                          <div className="text-foreground">Conectado</div>
                          <div>{u.ad_account_id ?? "—"}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing(u)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setActive.mutate({
                              targetUserId: u.id,
                              is_active: !u.is_active,
                            })
                          }
                        >
                          {u.is_active ? (
                            <>
                              <ShieldOff className="size-3.5" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="size-3.5" />
                              Ativar
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EditUserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["admin-users"] });
        }}
      />

      <CreateUserDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          qc.invalidateQueries({ queryKey: ["admin-users"] });
          qc.invalidateQueries({ queryKey: ["admin-stats"] });
        }}
      />
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="surface-glass rounded-xl p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-3 font-display text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync state when user changes
  useMemo(() => {
    setName(user?.full_name ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      await adminUpdateProfile({
        data: { targetUserId: user.id, full_name: name, email },
      });
      toast.success("Perfil atualizado.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "mentor">("mentor");
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("mentor");
  }

  async function create() {
    if (!email.trim() || password.length < 8) {
      toast.error("Informe e-mail válido e senha com ao menos 8 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await adminCreateUser({
        data: { email: email.trim(), password, full_name: name.trim() || null, role },
      });
      toast.success("Usuário criado.");
      reset();
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar usuário.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@empresa.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Senha provisória</Label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "mentor")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mentor">Mentorado</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={create} disabled={saving}>
            {saving ? "Criando…" : "Criar usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
