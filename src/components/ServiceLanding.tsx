import Link from "next/link";
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { TechChip } from "@/components/TechChip";
import { Cta } from "@/components/sections/Cta";
import { JsonLd } from "@/components/JsonLd";
import { ArrowRight, AlertCircle, Target, Wrench, Trophy } from "lucide-react";

export type ServiceLandingProps = {
  /** slug usado em /servicos/<slug> e nos JSON-LD */
  slug: string;
  /** eyebrow acima do título (ex.: "Serviço · Data Lake") */
  eyebrow: string;
  /** h1 da página — tem que conter a keyword principal */
  h1: ReactNode;
  /** subtítulo curto debaixo do h1 */
  subtitle: ReactNode;
  /** nome do serviço pra JSON-LD */
  serviceName: string;
  /** descrição usada em JSON-LD */
  serviceDescription: string;

  /** Tier 1 — A dor que esse serviço resolve */
  pain: { heading: string; body: string; bullets?: string[] };
  /** Tier 2 — O que entregamos */
  delivery: { heading: string; body: string; bullets: { title: string; text: string }[] };
  /** Tier 3 — Como funciona o trabalho */
  how: { heading: string; steps: { title: string; text: string }[] };
  /** Tier 4 — Resultado esperado */
  outcome: { heading: string; body: string; kpis?: { value: string; label: string }[] };

  /** Tech chips relacionadas */
  tech?: string[];
  /** Cases relacionados (slug) */
  relatedCases?: { slug: string; client: string; tagline: string }[];
  /** Posts de blog relacionados (slug) */
  relatedPosts?: { slug: string; title: string }[];
};

export function ServiceLanding(p: ServiceLandingProps) {
  const SITE = "https://azuris.com.br";

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: p.serviceName,
    description: p.serviceDescription,
    url: `${SITE}/servicos/${p.slug}`,
    provider: {
      "@type": "Organization",
      name: "Azuris",
      url: SITE,
    },
    areaServed: [
      { "@type": "Country", name: "Brasil" },
      { "@type": "Place", name: "América Latina" },
    ],
    serviceType: p.serviceName,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE },
      { "@type": "ListItem", position: 2, name: "Serviços", item: `${SITE}/servicos` },
      {
        "@type": "ListItem",
        position: 3,
        name: p.serviceName,
        item: `${SITE}/servicos/${p.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[serviceSchema, breadcrumbSchema]} />
      <Navbar />
      <main className="flex-1 pt-20">
        <PageHeader
          eyebrow={p.eyebrow}
          size="md"
          particleCount={1800}
          title={p.h1}
          intro={<p>{p.subtitle}</p>}
        />

        <article className="mx-auto max-w-5xl px-6 py-12 md:py-16 space-y-16">
          {/* Breadcrumb visual */}
          <nav
            aria-label="breadcrumb"
            className="text-sm text-foam/50 flex items-center gap-2"
          >
            <Link href="/" className="hover:text-cyan-brand">
              Início
            </Link>
            <span>/</span>
            <Link href="/servicos" className="hover:text-cyan-brand">
              Serviços
            </Link>
            <span>/</span>
            <span className="text-foam/70">{p.serviceName}</span>
          </nav>

          {/* PAIN */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span
                className="inline-flex items-center justify-center size-9 rounded-full"
                style={{
                  backgroundColor: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                }}
              >
                <AlertCircle className="size-5" strokeWidth={2.5} />
              </span>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {p.pain.heading}
              </h2>
            </div>
            <p className="text-base md:text-lg text-foam/85 leading-relaxed mb-5 max-w-3xl">
              {p.pain.body}
            </p>
            {p.pain.bullets?.length ? (
              <ul className="space-y-2 max-w-3xl">
                {p.pain.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex gap-2.5 text-foam/75 leading-relaxed"
                  >
                    <span className="text-red-400 mt-1">●</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* DELIVERY */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span
                className="inline-flex items-center justify-center size-9 rounded-full"
                style={{
                  backgroundColor: "rgba(20,183,222,0.15)",
                  color: "#14b7de",
                }}
              >
                <Wrench className="size-5" strokeWidth={2.5} />
              </span>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {p.delivery.heading}
              </h2>
            </div>
            <p className="text-base md:text-lg text-foam/85 leading-relaxed mb-6 max-w-3xl">
              {p.delivery.body}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {p.delivery.bullets.map((b) => (
                <div
                  key={b.title}
                  className="rounded-xl border border-slate/50 bg-deep/60 p-5"
                >
                  <div className="text-sm font-semibold text-cyan-brand mb-1.5">
                    {b.title}
                  </div>
                  <div className="text-sm text-foam/75 leading-relaxed">
                    {b.text}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* HOW */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span
                className="inline-flex items-center justify-center size-9 rounded-full"
                style={{
                  backgroundColor: "rgba(245,158,11,0.15)",
                  color: "#f59e0b",
                }}
              >
                <Target className="size-5" strokeWidth={2.5} />
              </span>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {p.how.heading}
              </h2>
            </div>
            <ol className="space-y-4">
              {p.how.steps.map((s, i) => (
                <li
                  key={s.title}
                  className="rounded-xl border border-slate/50 bg-deep/60 p-5 flex gap-4"
                >
                  <span className="text-xl font-semibold font-mono text-cyan-brand shrink-0 w-8">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-foam/75 leading-relaxed">
                      {s.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* OUTCOME */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span
                className="inline-flex items-center justify-center size-9 rounded-full"
                style={{
                  backgroundColor: "rgba(34,197,94,0.15)",
                  color: "#22c55e",
                }}
              >
                <Trophy className="size-5" strokeWidth={2.5} />
              </span>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {p.outcome.heading}
              </h2>
            </div>
            <div
              className="rounded-xl border p-6 md:p-8"
              style={{
                borderColor: "rgba(34,197,94,0.25)",
                background:
                  "linear-gradient(180deg, rgba(34,197,94,0.07) 0%, rgba(34,197,94,0.02) 100%)",
              }}
            >
              <p className="text-base md:text-lg text-foam font-medium leading-relaxed">
                {p.outcome.body}
              </p>
              {p.outcome.kpis?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  {p.outcome.kpis.map((k) => (
                    <div
                      key={k.label}
                      className="rounded-lg border border-emerald-500/20 bg-ink/40 px-3 py-3"
                    >
                      <div className="text-2xl font-semibold text-emerald-400 font-mono leading-none">
                        {k.value}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-foam/45 mt-1.5">
                        {k.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          {/* TECH chips */}
          {p.tech?.length ? (
            <section>
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-brand mb-3">
                Stack que usamos
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.tech.map((t) => (
                  <TechChip key={t} name={t} size="sm" />
                ))}
              </div>
            </section>
          ) : null}

          {/* CASES + POSTS relacionados */}
          {(p.relatedCases?.length || p.relatedPosts?.length) ? (
            <section className="border-t border-slate/40 pt-12">
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-brand mb-3">
                Veja na prática
              </div>

              {p.relatedCases?.length ? (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Cases relacionados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {p.relatedCases.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/cases/${c.slug}`}
                        className="group rounded-xl border border-slate/60 bg-deep p-5 hover:border-cyan-brand/50 transition-colors"
                      >
                        <div className="text-xs font-mono uppercase tracking-wider text-foam/40 mb-2">
                          {c.client}
                        </div>
                        <p className="text-sm text-foam/80 leading-relaxed mb-2">
                          {c.tagline}
                        </p>
                        <div className="inline-flex items-center gap-1.5 text-sm text-cyan-brand">
                          Ler o case
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {p.relatedPosts?.length ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Leitura recomendada</h3>
                  <div className="space-y-2">
                    {p.relatedPosts.map((b) => (
                      <Link
                        key={b.slug}
                        href={`/blog/${b.slug}`}
                        className="group flex items-center gap-3 rounded-lg border border-slate/40 bg-deep/50 p-4 hover:border-cyan-brand/50 transition-colors"
                      >
                        <span className="text-sm text-foam/80 group-hover:text-cyan-brand transition-colors flex-1">
                          {b.title}
                        </span>
                        <ArrowRight className="size-4 text-cyan-brand/70 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </article>

        <Cta />
      </main>
      <Footer />
    </>
  );
}
