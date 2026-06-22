import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/routes/auth";
import { Mail, Shield, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — HOF Circle Analytics" },
      { name: "description", content: "Conheça como o HOF Circle Analytics coleta, utiliza, armazena e protege os dados pessoais dos usuários da plataforma." },
      { property: "og:title", content: "Política de Privacidade — HOF Circle Analytics" },
      { property: "og:description", content: "Conheça como o HOF Circle Analytics coleta, utiliza, armazena e protege os dados pessoais dos usuários da plataforma." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ads.timedom.com.br/privacy-policy" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Política de Privacidade — HOF Circle Analytics" },
      { name: "twitter:description", content: "Conheça como o HOF Circle Analytics coleta, utiliza, armazena e protege os dados pessoais dos usuários da plataforma." },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "canonical", href: "https://ads.timedom.com.br/privacy-policy" },
    ],
  }),
  component: PrivacyPolicyPage,
});

const SECTIONS = [
  {
    id: "introducao",
    number: "1",
    title: "Introdução",
    content: (
      <>
        <p className="text-muted-foreground">
          O HOF Circle Analytics valoriza a privacidade e a proteção dos dados pessoais de seus usuários.
        </p>
        <p className="text-muted-foreground">
          Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos informações durante o uso da plataforma.
        </p>
      </>
    ),
  },
  {
    id: "informacoes-coletadas",
    number: "2",
    title: "Informações Coletadas",
    content: (
      <>
        <p>Podemos coletar:</p>
        <ul>
          <li>Nome</li>
          <li>E-mail</li>
          <li>Informações de autenticação</li>
          <li>Dados de uso da plataforma</li>
          <li>Dados autorizados por integrações com terceiros</li>
          <li>Informações relacionadas a contas de anúncios conectadas</li>
        </ul>
      </>
    ),
  },
  {
    id: "meta-ads",
    number: "3",
    title: "Integração com Meta Ads",
    content: (
      <>
        <p>
          Quando o usuário opta por conectar sua conta Meta Ads, a plataforma poderá acessar informações autorizadas através da Meta Marketing API.
        </p>
        <p>Os dados acessados são utilizados exclusivamente para:</p>
        <ul>
          <li>Exibição de métricas</li>
          <li>Geração de relatórios</li>
          <li>Análises estratégicas</li>
          <li>Insights automatizados</li>
        </ul>
        <p>
          A plataforma não publica, altera ou gerencia campanhas sem autorização explícita do usuário.
        </p>
      </>
    ),
  },
  {
    id: "uso-informacoes",
    number: "4",
    title: "Uso das Informações",
    content: (
      <>
        <p>As informações coletadas podem ser utilizadas para:</p>
        <ul>
          <li>Operação da plataforma</li>
          <li>Autenticação de usuários</li>
          <li>Geração de relatórios</li>
          <li>Melhoria da experiência</li>
          <li>Desenvolvimento de novos recursos</li>
          <li>Suporte técnico</li>
        </ul>
      </>
    ),
  },
  {
    id: "compartilhamento",
    number: "5",
    title: "Compartilhamento de Dados",
    content: (
      <>
        <p>Não comercializamos informações pessoais.</p>
        <p>Os dados poderão ser compartilhados apenas quando necessário para:</p>
        <ul>
          <li>Prestação dos serviços</li>
          <li>Cumprimento de obrigações legais</li>
          <li>Funcionamento de integrações autorizadas pelo usuário</li>
        </ul>
      </>
    ),
  },
  {
    id: "seguranca",
    number: "6",
    title: "Armazenamento e Segurança",
    content: (
      <>
        <p>
          Adotamos medidas técnicas e organizacionais adequadas para proteger os dados contra acesso não autorizado, perda, alteração ou divulgação indevida.
        </p>
      </>
    ),
  },
  {
    id: "direitos",
    number: "7",
    title: "Direitos do Usuário",
    content: (
      <>
        <p>O usuário poderá solicitar:</p>
        <ul>
          <li>Acesso aos seus dados</li>
          <li>Correção de informações</li>
          <li>Exclusão de dados</li>
          <li>Revogação de consentimentos</li>
          <li>Encerramento da conta</li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    number: "8",
    title: "Cookies e Tecnologias Semelhantes",
    content: (
      <>
        <p>
          A plataforma pode utilizar cookies e tecnologias semelhantes para melhorar a navegação, autenticação e análise de uso.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    number: "9",
    title: "Alterações desta Política",
    content: (
      <>
        <p>Esta Política poderá ser atualizada periodicamente.</p>
        <p>Alterações relevantes serão comunicadas através da plataforma.</p>
      </>
    ),
  },
  {
    id: "contato",
    number: "10",
    title: "Contato",
    content: (
      <>
        <p>
          Para dúvidas relacionadas à privacidade ou proteção de dados, entre em contato através do e-mail:
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

function PrivacyPolicyPage() {
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
                <Shield className="size-3.5 text-primary" />
                Documento institucional
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Política de Privacidade
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Última atualização: 22/06/2026
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
                Ao utilizar o HOF Circle Analytics, você concorda com os termos desta Política de Privacidade.
                Recomendamos a leitura periódica deste documento para se manter atualizado sobre nossas práticas.
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
                <Link to="/terms-of-use" className="transition hover:text-foreground">
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
