import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/routes/auth";
import { Mail, Scale, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — HOF Circle Analytics" },
      { name: "description", content: "Leia os Termos de Uso do HOF Circle Analytics. Condições de acesso, integrações, responsabilidades e direitos dos usuários da plataforma." },
      { property: "og:title", content: "Termos de Uso — HOF Circle Analytics" },
      { property: "og:description", content: "Leia os Termos de Uso do HOF Circle Analytics. Condições de acesso, integrações, responsabilidades e direitos dos usuários da plataforma." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ads.timedom.com.br/terms-of-service" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Termos de Uso — HOF Circle Analytics" },
      { name: "twitter:description", content: "Leia os Termos de Uso do HOF Circle Analytics. Condições de acesso, integrações, responsabilidades e direitos dos usuários da plataforma." },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "canonical", href: "https://ads.timedom.com.br/terms-of-service" },
    ],
  }),
  component: TermsOfServicePage,
});

function formatTodayBR() {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const SECTIONS = [
  {
    id: "aceitacao",
    number: "1",
    title: "Aceitação dos Termos",
    content: (
      <>
        <p className="text-muted-foreground">
          Ao acessar ou utilizar o HOF Circle Analytics, o usuário declara ter lido, compreendido e aceitado integralmente estes Termos de Uso.
        </p>
        <p className="text-muted-foreground">
          Caso não concorde com qualquer disposição destes Termos, o usuário não deverá utilizar a plataforma.
        </p>
      </>
    ),
  },
  {
    id: "sobre-plataforma",
    number: "2",
    title: "Sobre a Plataforma",
    content: (
      <>
        <p className="text-muted-foreground">
          O HOF Circle Analytics é uma plataforma de inteligência de dados e análise de desempenho destinada ao acompanhamento de métricas de marketing, campanhas publicitárias e indicadores estratégicos de negócios.
        </p>
        <p className="text-muted-foreground">
          A plataforma poderá integrar dados provenientes de serviços de terceiros mediante autorização do usuário.
        </p>
      </>
    ),
  },
  {
    id: "cadastro-acesso",
    number: "3",
    title: "Cadastro e Acesso",
    content: (
      <>
        <p className="text-muted-foreground">
          Para utilizar determinados recursos, o usuário deverá criar uma conta e fornecer informações verdadeiras, completas e atualizadas.
        </p>
        <p className="text-muted-foreground">
          O usuário é responsável pela confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
        </p>
      </>
    ),
  },
  {
    id: "integracoes-terceiros",
    number: "4",
    title: "Integrações com Terceiros",
    content: (
      <>
        <p className="text-muted-foreground">
          A plataforma poderá oferecer integração com serviços de terceiros, incluindo, mas não se limitando a:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
          <li className="text-muted-foreground">Meta Ads</li>
          <li className="text-muted-foreground">Google Ads</li>
          <li className="text-muted-foreground">Google Analytics</li>
          <li className="text-muted-foreground">Ferramentas de CRM</li>
          <li className="text-muted-foreground">Outras plataformas de marketing e análise</li>
        </ul>
        <p className="text-muted-foreground">
          Ao conectar uma integração, o usuário autoriza o acesso aos dados necessários para o funcionamento dos recursos disponibilizados.
        </p>
      </>
    ),
  },
  {
    id: "uso-permitido",
    number: "5",
    title: "Uso Permitido",
    content: (
      <>
        <p className="text-muted-foreground">
          O usuário concorda em utilizar a plataforma apenas para finalidades legítimas e de acordo com a legislação aplicável.
        </p>
        <p className="text-muted-foreground">É proibido:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
          <li className="text-muted-foreground">Tentar obter acesso não autorizado a sistemas ou dados</li>
          <li className="text-muted-foreground">Utilizar a plataforma para atividades ilícitas</li>
          <li className="text-muted-foreground">Interferir no funcionamento da plataforma</li>
          <li className="text-muted-foreground">Compartilhar credenciais de forma indevida</li>
          <li className="text-muted-foreground">Utilizar a plataforma para prejudicar terceiros</li>
        </ul>
      </>
    ),
  },
  {
    id: "propriedade-intelectual",
    number: "6",
    title: "Propriedade Intelectual",
    content: (
      <>
        <p className="text-muted-foreground">
         Todos os direitos relacionados ao HOF Circle Analytics, incluindo software, marca, identidade visual, funcionalidades, conteúdos e tecnologias, pertencem aos seus respectivos titulares.
        </p>
        <p className="text-muted-foreground">
          Nenhum direito de propriedade intelectual é transferido ao usuário.
        </p>
      </>
    ),
  },
  {
    id: "disponibilidade",
    number: "7",
    title: "Disponibilidade da Plataforma",
    content: (
      <>
        <p className="text-muted-foreground">
          Embora sejam empregados esforços para manter a plataforma disponível e operacional, não é garantida disponibilidade ininterrupta ou livre de falhas.
        </p>
        <p className="text-muted-foreground">
          Poderão ocorrer interrupções temporárias para manutenção, atualizações ou fatores externos.
        </p>
      </>
    ),
  },
  {
    id: "limitacao-responsabilidade",
    number: "8",
    title: "Limitação de Responsabilidade",
    content: (
      <>
        <p className="text-muted-foreground">
          O HOF Circle Analytics disponibiliza informações, métricas e análises com base nos dados fornecidos pelos usuários e integrações autorizadas.
        </p>
        <p className="text-muted-foreground">
          A plataforma não garante resultados financeiros, comerciais ou publicitários específicos.
        </p>
        <p className="text-muted-foreground">
          As decisões tomadas com base nos dados apresentados são de responsabilidade exclusiva do usuário.
        </p>
      </>
    ),
  },
  {
    id: "cancelamento",
    number: "9",
    title: "Cancelamento e Encerramento de Conta",
    content: (
      <>
        <p className="text-muted-foreground">
          O usuário poderá solicitar o encerramento de sua conta a qualquer momento.
        </p>
        <p className="text-muted-foreground">
          A plataforma poderá suspender ou encerrar contas que violem estes Termos de Uso ou apresentem atividades consideradas abusivas, fraudulentas ou ilegais.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    number: "10",
    title: "Alterações nos Termos",
    content: (
      <>
        <p className="text-muted-foreground">
          Estes Termos de Uso poderão ser atualizados periodicamente.
        </p>
        <p className="text-muted-foreground">
          A continuidade da utilização da plataforma após alterações constitui aceitação da versão vigente.
        </p>
      </>
    ),
  },
  {
    id: "lei-aplicavel",
    number: "11",
    title: "Lei Aplicável",
    content: (
      <>
        <p className="text-muted-foreground">
          Estes Termos serão regidos pelas leis da República Federativa do Brasil.
        </p>
      </>
    ),
  },
  {
    id: "contato",
    number: "12",
    title: "Contato",
    content: (
      <>
        <p className="text-muted-foreground">
          Dúvidas relacionadas a estes Termos poderão ser encaminhadas para:
        </p>
        <p>
          <a
            href="mailto:contato@timedom.com.br"
            className="inline-flex items-center gap-2 font-medium text-primary transition hover:text-primary/80"
          >
            <Mail className="size-4" />
            contato@timedom.com.br
          </a>
        </p>
      </>
    ),
  },
];

function TermsOfServicePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="dotted-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
            <Link to="/" className="flex items-center gap-3 transition hover:opacity-90">
              <BrandMark />
              <div className="font-display text-sm font-semibold tracking-tight">
                HOF Circle <span className="text-muted-foreground">Analytics</span>
              </div>
            </Link>
            <a
              href="mailto:contato@timedom.com.br"
              className="hidden items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex"
            >
              <Mail className="size-3.5" />
              contato@timedom.com.br
            </a>
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto w-full max-w-[920px] flex-1 px-4 py-12 sm:px-8 sm:py-16 lg:py-20">
          <article className="surface-panel p-7 sm:p-10 lg:p-14">
            {/* Title block */}
            <div className="mb-10 border-b border-border pb-8 sm:mb-12 sm:pb-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                <Scale className="size-3.5 text-primary" />
                Documento institucional
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Termos de Uso
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Última atualização: {formatTodayBR()}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-10 sm:space-y-12">
              {SECTIONS.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="mb-4 flex items-center gap-3 font-display text-xl font-semibold tracking-tight sm:text-2xl">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-xs font-bold text-primary sm:size-9 sm:text-sm">
                      {section.number}
                    </span>
                    {section.title}
                  </h2>
                  <div className="space-y-3 pl-0 text-sm leading-relaxed text-muted-foreground sm:pl-11 sm:text-base">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>

            {/* Closing note */}
            <div className="mt-12 rounded-xl border border-border bg-card/50 p-6 sm:mt-14">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ao utilizar o HOF Circle Analytics, você concorda com estes Termos de Uso. Recomendamos a leitura periódica deste documento para acompanhar eventuais atualizações.
              </p>
            </div>
          </article>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-3">
                <BrandMark className="size-8" />
                <div>
                  <div className="font-display text-sm font-semibold tracking-tight">HOF Circle Analytics</div>
                  <p className="text-[11px] text-muted-foreground">Inteligência estratégica para crescimento previsível</p>
                </div>
              </div>

              <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
                <Link to="/privacy-policy" className="transition hover:text-foreground">
                  Política de Privacidade
                </Link>
                <Link to="/terms-of-service" className="transition hover:text-foreground">
                  Termos de Uso
                </Link>
                <a href="mailto:contato@timedom.com.br" className="inline-flex items-center gap-1 transition hover:text-foreground">
                  Contato
                  <ExternalLink className="size-3" />
                </a>
              </nav>
            </div>

            <div className="mt-8 border-t border-border pt-6 text-center text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} HOF Circle Analytics. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
