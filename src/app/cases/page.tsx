import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { TechChip } from "@/components/TechChip";
import { Cta } from "@/components/sections/Cta";
import { Partners } from "@/components/sections/Partners";
import { getAllCases } from "@/lib/cases";
import cv from "@/lib/cv.json";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Cases de Engenharia de Dados — Lakehouse, Migração e IA",
  description:
    "Cases reais com KPIs verificáveis: migração 100TB sem downtime na RD Station, lakehouse na Logcomex, 100+ profissionais capacitados na Sicredi. Logcomex, Unimed, Sicredi, RD Station, Buscapé.",
  keywords: [
    "cases engenharia de dados",
    "case migração 100TB",
    "case lakehouse",
    "case data lake",
    "case ClickHouse",
    "Logcomex Azuris",
    "RD Station migração cloud",
    "Sicredi treinamento dados",
  ],
  openGraph: {
    title: "Cases de Engenharia de Dados — Lakehouse, Migração e IA",
    description:
      "Cases reais com KPIs verificáveis: 100TB migrados sem downtime, lakehouse em produção, 100+ profissionais capacitados.",
    type: "website",
  },
  alternates: { canonical: "/cases" },
};

type CvCase = {
  slug: string;
  client: string;
  title: string;
  tagline: string;
  period?: string;
  logo?: string;
  accent?: string;
  kpis?: { value: string; label: string }[];
  tech?: string[];
  star?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  /** Card de chamada — quando presente, substitui o STAR no card da listagem */
  intro?: string[];
  resultPerceived?: string;
  quote?: { text: string; author: string; role: string };
};

const HERO_STATS = [
  { value: "15", label: "anos transformando dado em decisão" },
  { value: "5", label: "clientes neste portfólio" },
  { value: "100+", label: "profissionais capacitados" },
  { value: "100 TB", label: "migrados sem interrupção" },
];

export default function CasesPage() {
  const detailed = new Map(getAllCases().map((c) => [c.slug, c]));
  const items = (cv.cases as CvCase[]).map((c) => ({
    ...c,
    hasDetail: detailed.has(c.slug),
  }));

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <PageHeader
          eyebrow="Cases"
          size="md"
          title={
            <>
              Resultado em produção,
              <br />
              <span className="text-brand-gradient">não em PowerPoint.</span>
            </>
          }
          intro={
            <div className="space-y-4">
              <p>
                Se você é diretor, head de tecnologia ou dono de operação,
                a pergunta é simples: <strong className="text-foam">em quem
                confiar</strong> uma decisão que envolve custo, prazo e a
                continuidade do negócio?
              </p>
              <p>
                Cada cliente abaixo é uma resposta direta. Em três blocos
                curtos você lê <strong className="text-foam">a dor</strong>{" "}
                que estava na mesa, <strong className="text-foam">o que
                entregamos</strong> e <strong className="text-foam">o
                número</strong> que ficou no fim. Sem &ldquo;transformação
                digital&rdquo;, sem promessa vazia — só retorno verificável.
              </p>
            </div>
          }
        />

        {/* Hero stats agregadas */}
        <section className="border-b border-slate/40 bg-deep/40">
          <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <div className="text-3xl md:text-4xl font-semibold text-cyan-brand font-mono leading-none">
                  {s.value}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-foam/50 mt-2">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cards horizontais */}
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20 space-y-6">
          {items.map((c, idx) => {
            const accent = c.accent ?? "#14b7de";
            return (
              <article
                key={c.slug}
                className="group/card relative overflow-hidden rounded-2xl border border-slate/60 bg-deep transition-all hover:border-cyan-brand/60 hover:shadow-2xl hover:shadow-cyan-brand/5"
              >
                {/* Top bar: logo horizontal + meta + cta */}
                <header
                  className="relative flex flex-wrap items-center gap-4 px-6 md:px-8 py-5 border-b border-slate/40 overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, ${accent}14 0%, transparent 55%), rgba(255,255,255,0.02)`,
                  }}
                >
                  <div
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ background: accent }}
                  />

                  {/* Logo bloco horizontal */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="flex items-center justify-center h-12 w-16 sm:w-20 rounded-md bg-white px-2 shrink-0"
                      style={{
                        boxShadow: `0 0 0 1px ${accent}33, 0 8px 24px -12px ${accent}66`,
                      }}
                    >
                      {c.logo ? (
                        <Image
                          src={c.logo}
                          alt={`${c.client} logo`}
                          width={120}
                          height={40}
                          className="max-h-8 w-auto object-contain"
                        />
                      ) : (
                        <span
                          className="font-semibold text-sm tracking-tight"
                          style={{ color: accent }}
                        >
                          {c.client}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base md:text-lg font-semibold text-foam leading-tight">
                        {c.client}
                      </div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-foam/45 mt-0.5">
                        #{String(idx + 1).padStart(2, "0")} · {c.period}
                      </div>
                    </div>
                  </div>

                  <div className="ml-auto">
                    {c.hasDetail ? (
                      <Link
                        href={`/cases/${c.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-cyan-brand/90 border border-cyan-brand/30 rounded-full px-3 py-1.5 hover:bg-cyan-brand/10 hover:text-cyan-brand transition-colors"
                      >
                        ver case
                        <ArrowRight className="size-3.5 transition-transform group-hover/card:translate-x-0.5" />
                      </Link>
                    ) : (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-foam/30 border border-slate/40 rounded-full px-3 py-1">
                        em breve
                      </span>
                    )}
                  </div>
                </header>

                {/* Body */}
                <div className="p-6 md:p-8 lg:p-10">
                  <h3 className="text-2xl md:text-3xl font-semibold leading-snug tracking-tight mb-6">
                    {c.title}
                  </h3>

                  {/* LAYOUT "CHAMADA" — quando há intro, é a versão editorial do card */}
                  {c.intro?.length ? (
                    <>
                      <div className="space-y-4 text-foam/85 leading-relaxed mb-8 max-w-3xl">
                        {c.intro.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>

                      {c.tech?.length ? (
                        <div className="mb-8">
                          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-cyan-brand mb-3">
                            Tecnologias abordadas
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {c.tech.map((t) => (
                              <TechChip key={t} name={t} size="sm" />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {c.resultPerceived ? (
                        <div
                          className="rounded-xl border p-5 md:p-6 mb-8"
                          style={{
                            borderColor: "rgba(34,197,94,0.25)",
                            background:
                              "linear-gradient(180deg, rgba(34,197,94,0.07) 0%, rgba(34,197,94,0.02) 100%)",
                          }}
                        >
                          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-400/90 mb-2">
                            Resultado percebido
                          </div>
                          <p className="text-base md:text-lg text-foam font-medium leading-relaxed">
                            {c.resultPerceived}
                          </p>
                        </div>
                      ) : null}

                      {c.quote ? (
                        <figure
                          className="relative rounded-xl border p-5 md:p-6 mb-2 overflow-hidden"
                          style={{
                            borderColor: `${accent}40`,
                            background: `linear-gradient(135deg, ${accent}12 0%, transparent 70%), rgba(255,255,255,0.02)`,
                          }}
                        >
                          <blockquote className="text-base md:text-lg italic font-medium leading-snug text-foam max-w-2xl">
                            “{c.quote.text}”
                          </blockquote>
                          <figcaption className="mt-3 text-xs md:text-sm text-foam/65">
                            — <span className="font-semibold text-foam">{c.quote.author}</span>
                            <span className="block text-foam/50 mt-0.5">
                              {c.quote.role}
                            </span>
                          </figcaption>
                        </figure>
                      ) : null}

                      {c.hasDetail ? (
                        <div className="mt-7 pt-5 border-t border-slate/40">
                          <Link
                            href={`/cases/${c.slug}`}
                            className="inline-flex items-center gap-2 text-base font-medium text-cyan-brand hover:gap-3 transition-all"
                          >
                            Conheça o case completo
                            <ArrowRight className="size-4" />
                          </Link>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    /* LAYOUT PADRÃO — narrativa STAR + Outcome (cases sem chamada custom) */
                    <>
                      {c.star ? (
                        <div className="space-y-4 text-foam/80 leading-relaxed mb-7 max-w-3xl">
                          <p>
                            {c.star.situation}{" "}
                            <span className="text-foam/70">{c.star.task}</span>
                          </p>
                          <p>{c.star.action}</p>
                        </div>
                      ) : (
                        <p className="text-foam/75 leading-relaxed mb-7 max-w-3xl">
                          {c.tagline}
                        </p>
                      )}

                      {c.star?.result ? (
                        <div
                          className="rounded-xl border p-5 md:p-6 mb-6"
                          style={{
                            borderColor: "rgba(34,197,94,0.25)",
                            background:
                              "linear-gradient(180deg, rgba(34,197,94,0.07) 0%, rgba(34,197,94,0.02) 100%)",
                          }}
                        >
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-400/90 mb-2">
                            Outcome
                          </div>
                          <p className="text-base md:text-lg text-foam font-medium leading-relaxed">
                            {c.star.result}
                          </p>

                          {c.kpis?.length ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                              {c.kpis.map((k) => (
                                <div
                                  key={k.label}
                                  className="rounded-lg border border-emerald-500/20 bg-ink/40 px-3 py-2.5"
                                >
                                  <div className="text-xl font-semibold text-emerald-400 font-mono leading-none">
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
                      ) : null}

                      {c.tech?.length ? (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {c.tech.map((t) => (
                            <TechChip key={t} name={t} size="sm" />
                          ))}
                        </div>
                      ) : null}

                      {c.hasDetail ? (
                        <div className="mt-7 pt-5 border-t border-slate/40">
                          <Link
                            href={`/cases/${c.slug}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-brand hover:gap-3 transition-all"
                          >
                            Ler o case completo
                            <ArrowRight className="size-4" />
                          </Link>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <Partners />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
