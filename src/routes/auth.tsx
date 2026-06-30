import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acessar — HOF Circle Analytics" },
      { name: "description", content: "Acesse a plataforma premium de inteligência de crescimento." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const dest = await resolveRoleDestination(data.session.user.id);
        navigate({ to: dest });
      }
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { data: signed, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Check active state
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_active")
          .eq("id", signed.user.id)
          .maybeSingle();
        if (profile && profile.is_active === false) {
          await supabase.auth.signOut();
          throw new Error("Sua conta está desativada. Entre em contato com um administrador.");
        }
        toast.success("Bem-vindo de volta.");
        const dest = await resolveRoleDestination(signed.user.id);
        navigate({ to: dest });
      } else {
        const { data: signed, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Garantir sessão ativa (auto-confirm habilitado nesta fase do projeto)
        if (!signed.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) throw signInErr;
        }
        toast.success("Conta criada! Acesso liberado.");
        const uid = signed.user?.id;
        const dest = uid ? await resolveRoleDestination(uid) : "/dashboard";
        navigate({ to: dest });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível processar a solicitação.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="dotted-grid pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left — brand */}
        <div className="hidden flex-col justify-between border-r border-border p-12 lg:flex">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="font-display text-sm font-semibold tracking-tight">
              HOF Circle <span className="text-muted-foreground">Analytics</span>
            </div>
          </div>

          <div className="space-y-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                <span className="size-1.5 rounded-full bg-primary" />
                Acesso restrito — comunidade HOF Circle
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight xl:text-5xl">
                Inteligência estratégica para{" "}
                <span className="text-gradient-accent">crescimento previsível</span>.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Acompanhe indicadores, campanhas e oportunidades em um único ambiente.
                Decisões melhores. Operação no controle.
              </p>
            </div>

            <div className="grid gap-4">
              <FeatureRow icon={TrendingUp} title="Centro de decisão" desc="Métricas críticas, tendências e impacto financeiro em tempo real." />
              <FeatureRow icon={Sparkles} title="Insights estratégicos" desc="Análises automáticas que apontam onde escalar e onde proteger." />
              <FeatureRow icon={ShieldCheck} title="Dados sob controle" desc="Ambiente privado, auditado e pensado para gestores exigentes." />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} HOF Circle Analytics
          </div>
        </div>

        {/* Right — form */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <BrandMark />
              <div className="font-display text-sm font-semibold tracking-tight">
                HOF Circle <span className="text-muted-foreground">Analytics</span>
              </div>
            </div>

            <div className="surface-panel p-7 sm:p-9">
              <div className="mb-7">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {mode === "signin" ? "Acessar plataforma" : "Criar acesso"}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {mode === "signin"
                    ? "Entre com suas credenciais HOF Circle."
                    : "Configure suas credenciais de acesso."}
                </p>
              </div>

              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com"
                    className="h-11 border-border bg-background/60 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                      Senha
                    </Label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground transition hover:text-foreground"
                        onClick={() => toast.info("Entre em contato com seu mentor para recuperar o acesso.")}
                      >
                        Recuperar acesso
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 border-border bg-background/60 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="group h-11 w-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition hover:bg-primary/90"
                >
                  {loading ? "Acessando…" : mode === "signin" ? "Acessar plataforma" : "Criar acesso"}
                  <ArrowRight className="ml-1 size-4 transition group-hover:translate-x-0.5" />
                </Button>
              </form>

              <div className="mt-6 border-t border-border pt-5 text-center text-xs text-muted-foreground">
                {mode === "signin" ? (
                  <>Ainda não tem acesso?{" "}
                    <button onClick={() => setMode("signup")} className="font-medium text-foreground hover:text-primary">
                      Criar conta
                    </button>
                  </>
                ) : (
                  <>Já tem acesso?{" "}
                    <button onClick={() => setMode("signin")} className="font-medium text-foreground hover:text-primary">
                      Acessar
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
              Ao acessar, você concorda com os termos de uso da plataforma HOF Circle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon: Icon, title, desc }: { icon: typeof TrendingUp; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs leading-relaxed text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

async function resolveRoleDestination(userId: string): Promise<"/admin" | "/dashboard"> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return data ? "/admin" : "/dashboard";
}

import logoAsset from "@/assets/ads-logo.png.asset.json";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="ADS HOF Circle"
      className={`h-9 w-auto select-none object-contain ${className}`}
      draggable={false}
    />
  );
}
