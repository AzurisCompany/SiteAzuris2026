import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { TechChip } from "@/components/TechChip";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { Cta } from "@/components/sections/Cta";
import { JsonLd } from "@/components/JsonLd";
import { getAllCaseSlugs, getAllCases, getCaseBySlug } from "@/lib/cases";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Briefcase,
  AlertCircle,
  Target,
  Wrench,
  Trophy,
  Quote,
} from "lucide-react";

export async function generateStaticParams() {
  return getAllCaseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/cases/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const c = getCaseBySlug(slug);
  if (!c) return { title: "Case não encontrado" };
  return {
    title: `${c.client} — ${c.title}`,
    description: c.tagline,
    openGraph: {
      title: `${c.client} — ${c.title}`,
      description: c.tagline,
      type: "article",
      images: c.photos?.[0]?.src ? [{ url: c.photos[0].src }] : undefined,
    },
  };
}

const STAR_BLOCKS = [
  {
    key: "situation" as const,
    label: "Situação",
    sublabel: "A dor que estava na mesa",
    icon: AlertCircle,
    color: "#ef4444",
  },
  {
    key: "task" as const,
    label: "Tarefa",
    sublabel: "O que tinha que ser feito",
    icon: Target,
    color: "#f59e0b",
  },
  {
    key: "action" as const,
    label: "Ação",
    sublabel: "O que a Azuris entregou",
    icon: Wrench,
    color: "#14b7de",
  },
  {
    key: "result" as const,
    label: "Resultado",
    sublabel: "O que ficou no fim",
    icon: Trophy,
    color: "#22c55e",
  },
];

export default async function CaseDetailPage(
  props: PageProps<"/cases/[slug]">,
) {
  const { slug } = await props.params;
  const c = getCaseBySlug(slug);
  if (!c) notFound();

  const others = getAllCases().filter((x) => x.slug !== slug).slice(0, 2);

  const caseSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${c.client} — ${c.title}`,
    description: c.tagline,
    image: c.photos?.[0]?.src
      ? [`https://azuris.com.br${c.photos[0].src}`]
      : undefined,
    datePublished: "2026-05-18",
    author: {
      "@type": "Organization",
      name: "Azuris",
      url: "https://azuris.com.br",
    },
    publisher: {
      "@type": "Organization",
      name: "Azuris",
      logo: {
        "@type": "ImageObject",
        url: "https://azuris.com.br/azuris-logo.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://azuris.com.br/cases/${c.slug}`,
    },
    about: c.tech,
    inLanguage: "pt-BR",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: "https://azuris.com.br" },
      { "@type": "ListItem", position: 2, name: "Cases", item: "https://azuris.com.br/cases" },
      {
        "@type": "ListItem",
        position: 3,
        name: c.client,
        item: `https://azuris.com.br/cases/${c.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[caseSchema, breadcrumbSchema]} />
      <Navbar />
      <main className="flex-1 pt-20">
        <PageHeader
          eyebrow={`Case · ${c.client}`}
          size="md"
          particleCount={1800}
          title={<>{c.title}</>}
          intro={<p>{c.tagline}</p>}
        />

        <article className="mx-auto max-w-5xl px-6 py-10 md:py-14">
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 text-sm text-foam/50 hover:text-cyan-brand mb-8"
          >
            <ArrowLeft className="size-4" /> Todos os cases
          </Link>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-foam/60 border-y border-slate/40 py-5 mb-10">
            {c.role ? (
              <span className="inline-flex items-center gap-2">
                <Briefcase className="size-4 text-cyan-brand/70" />
                {c.role}
              </span>
            ) : null}
            {c.period ? (
              <span className="inline-flex items-center gap-2">
                <Calendar className="size-4 text-cyan-brand/70" />
                {c.period}
              </span>
            ) : null}
            {c.location ? (
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4 text-cyan-brand/70" />
                {c.location}
              </span>
            ) : null}
          </div>

          {/* GALERIA NO TOPO — CARROSSEL */}
          {c.photos?.length ? (
            <section className="mb-14">
              <PhotoCarousel photos={c.photos} />
            </section>
          ) : null}

          {/* QUEM É A EMPRESA */}
          {c.companyBrief?.length ? (
            <section className="mb-14">
              <div className="flex items-center gap-4 mb-5">
                {c.logo ? (
                  <div
                    className="flex items-center justify-center h-12 w-20 rounded-md bg-white px-2 shrink-0"
                    style={{
                      boxShadow: `0 0 0 1px ${(c.accent ?? "#14b7de")}33, 0 8px 24px -12px ${(c.accent ?? "#14b7de")}66`,
                    }}
                  >
                    <Image
                      src={c.logo}
                      alt={`${c.client} logo`}
                      width={120}
                      height={40}
                      className="max-h-8 w-auto object-contain"
                    />
                  </div>
                ) : null}
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Sobre a {c.client}
                </h2>
              </div>
              <div className="space-y-4 text-foam/80 leading-relaxed max-w-3xl">
                {c.companyBrief.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ) : null}

          {/* CHAMADA — intro curta antes do STAR */}
          {c.intro?.length ? (
            <section className="mb-14">
              <div className="space-y-4 text-foam/85 leading-relaxed max-w-3xl text-base md:text-lg">
                {c.intro.map((p, i) => (
                  <p key={i} className={i === 0 ? "text-foam font-medium" : ""}>
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          {/* STAR RESUMIDO */}
          {c.star ? (
            <section className="mb-14">
              <div className="mb-6">
                <div className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-brand mb-2">
                  Resumo executivo
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  O projeto em quatro tempos.
                </h2>
                <p className="text-sm text-foam/55 mt-2">
                  Método STAR — Situação, Tarefa, Ação e Resultado. Em uma
                  passada de olho você sabe o que entregamos e por quê.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STAR_BLOCKS.map((b) => {
                  const Icon = b.icon;
                  return (
                    <div
                      key={b.key}
                      className="rounded-xl border p-5 md:p-6 bg-deep/60"
                      style={{ borderColor: `${b.color}33` }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="inline-flex items-center justify-center size-8 rounded-full"
                          style={{
                            backgroundColor: `${b.color}1f`,
                            color: b.color,
                          }}
                        >
                          <Icon className="size-4" strokeWidth={2.5} />
                        </span>
                        <div>
                          <div
                            className="text-[11px] font-mono uppercase tracking-[0.18em]"
                            style={{ color: b.color }}
                          >
                            {b.label}
                          </div>
                          <div className="text-xs text-foam/50">
                            {b.sublabel}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm md:text-base text-foam/85 leading-relaxed">
                        {c.star![b.key]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* KPIs */}
          {c.kpis?.length ? (
            <section className="mb-14">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {c.kpis.map((k) => (
                  <div
                    key={k.label}
                    className="rounded-xl border border-slate/50 bg-deep px-4 py-5"
                  >
                    <div className="text-3xl font-semibold text-cyan-brand font-mono">
                      {k.value}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-foam/40 mt-1">
                      {k.label}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Tech chips */}
          {c.tech?.length ? (
            <section className="mb-14">
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-brand mb-3">
                Stack abordada
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.tech.map((t) => (
                  <TechChip key={t} name={t} size="sm" />
                ))}
              </div>
            </section>
          ) : null}

          {/* DEPOIMENTO */}
          {c.quote ? (
            <section className="mb-14">
              <figure
                className="relative rounded-2xl border p-6 md:p-10 overflow-hidden"
                style={{
                  borderColor: `${c.accent ?? "#14b7de"}40`,
                  background: `linear-gradient(135deg, ${c.accent ?? "#14b7de"}12 0%, transparent 70%), rgba(255,255,255,0.02)`,
                }}
              >
                <Quote
                  className="absolute top-5 right-5 size-12 md:size-16 opacity-15"
                  style={{ color: c.accent ?? "#14b7de" }}
                  aria-hidden
                />
                <blockquote className="text-lg md:text-2xl font-medium leading-snug text-foam max-w-3xl relative">
                  “{c.quote.text}”
                </blockquote>
                <figcaption className="mt-5 text-sm text-foam/70">
                  <span className="font-semibold text-foam">
                    {c.quote.author}
                  </span>
                  <span className="block text-foam/55 text-xs md:text-sm mt-0.5">
                    {c.quote.role}
                  </span>
                </figcaption>
              </figure>
            </section>
          ) : null}

          {/* DETALHE TÉCNICO (pra quem quer drillar) */}
          <div className="border-t border-slate/40 pt-12">
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-brand mb-2">
              Detalhamento técnico
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
              Para quem quer entrar no mérito.
            </h2>
            <p className="text-foam/60 mb-10">
              A partir daqui o conteúdo é técnico — arquitetura, gargalos
              mapeados, plano de capacitação e ferramentas abordadas.
            </p>

            <div className="space-y-14">
              {c.sections.map((s) => (
                <section key={s.heading}>
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
                    {s.heading}
                  </h3>
                  {s.body ? (
                    <p className="text-foam/80 leading-relaxed mb-6">
                      {s.body}
                    </p>
                  ) : null}
                  {s.bullets?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {s.bullets.map((b) => (
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
                  ) : null}
                </section>
              ))}

              {c.plan?.length ? (
                <section>
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-6">
                    Estrutura do programa
                  </h3>
                  <ol className="space-y-4">
                    {c.plan.map((m, i) => (
                      <li
                        key={m.title}
                        className="rounded-xl border border-slate/50 bg-deep/60 p-5"
                      >
                        <div className="flex items-baseline gap-3 mb-3">
                          <span className="text-xs font-mono text-cyan-brand/80">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <h4 className="text-lg font-semibold">{m.title}</h4>
                        </div>
                        <ul className="space-y-1.5 text-sm text-foam/75 list-disc list-outside ml-5">
                          {m.items.map((it) => (
                            <li key={it}>{it}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {c.tools?.length ? (
                <section>
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
                    Ferramentas abordadas
                  </h3>
                  <p className="text-foam/60 mb-6">
                    Cada ferramenta com bloco prático: introdução, conceitos,
                    casos de uso, demonstração e integração com a stack do
                    cliente.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {c.tools.map((t) => (
                      <div
                        key={t.name}
                        className="rounded-xl border border-slate/50 bg-deep/60 p-5"
                      >
                        <div className="flex items-baseline justify-between mb-2">
                          <h4 className="text-base font-semibold text-foam">
                            {t.name}
                          </h4>
                          {t.hours ? (
                            <span className="text-[11px] font-mono text-cyan-brand/80">
                              {t.hours}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-foam/75 leading-relaxed mb-2">
                          {t.blurb}
                        </p>
                        {t.fit ? (
                          <p className="text-xs text-foam/55 leading-relaxed border-t border-slate/40 pt-2 mt-2">
                            <span className="text-cyan-brand/80 font-mono uppercase tracking-wider mr-1">
                              fit:
                            </span>
                            {t.fit}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </article>

        {/* Outros cases */}
        {others.length ? (
          <section className="border-t border-slate/40 bg-deep/30 py-20">
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
                Outros cases
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-10">
                Continue explorando.
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {others.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/cases/${o.slug}`}
                    className="group rounded-2xl border border-slate/60 bg-deep p-6 hover:border-cyan-brand/50 transition-colors"
                  >
                    <div className="text-xs font-mono uppercase tracking-wider text-foam/40 mb-2">
                      {o.client}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-cyan-brand transition-colors">
                      {o.title}
                    </h3>
                    <p className="text-sm text-foam/60 line-clamp-2 mb-3">
                      {o.tagline}
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-sm text-cyan-brand">
                      Ler o case
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <Cta />
      </main>
      <Footer />
    </>
  );
}
