import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { CourseCallout } from "@/components/CourseCallout";
import { Cta } from "@/components/sections/Cta";
import {
  ArrowRight,
  Database,
  GitBranch,
  TrendingDown,
  Zap,
  GraduationCap,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "Serviços — Engenharia de Dados, Lakehouse, ClickHouse, IA",
  description:
    "Serviços de engenharia de dados: construção de Data Lake, migração de dados sem downtime, redução de custo de Big Data, implementação de ClickHouse e treinamento corporativo.",
  keywords: [
    "serviços engenharia de dados",
    "consultoria big data",
    "data lake construção",
    "migração de dados",
    "redução custo big data",
    "consultoria ClickHouse",
    "treinamento corporativo dados",
  ],
  openGraph: {
    title: "Serviços Azuris — Engenharia de Dados e IA",
    description:
      "Data Lake, migração, ClickHouse, redução de custo e capacitação. Cases reais com KPIs verificáveis.",
    type: "website",
  },
  alternates: { canonical: "/servicos" },
};

const SERVICOS = [
  {
    slug: "construcao-data-lake",
    icon: Database,
    title: "Construção de Data Lake",
    blurb:
      "Lakehouse moderno (Medallion + Iceberg) entregue em 90 dias. Da fonte ao primeiro dashboard.",
    keywords: ["Lakehouse", "Iceberg", "Medallion", "Spark", "Airflow"],
    accent: "#14b7de",
  },
  {
    slug: "migracao-de-dados",
    icon: GitBranch,
    title: "Migração de Dados",
    blurb:
      "Hadoop on-premise → Cloud sem downtime. 100 TB migrados sem perder um segundo de operação.",
    keywords: ["Hadoop", "Cloud", "Zero downtime", "Dual-run"],
    accent: "#a855f7",
  },
  {
    slug: "reducao-custo-big-data",
    icon: TrendingDown,
    title: "Redução de Custo de Big Data",
    blurb:
      "Assessment técnico que identifica 30-50% de gordura em Snowflake, Databricks, BigQuery e ClickHouse.",
    keywords: ["FinOps", "Snowflake", "Databricks", "BigQuery"],
    accent: "#ef4444",
  },
  {
    slug: "clickhouse",
    icon: Zap,
    title: "ClickHouse",
    blurb:
      "OLAP columnar de alta performance. Alternativa a Snowflake/BigQuery em workloads contínuos.",
    keywords: ["ClickHouse", "OLAP", "Real-time", "Materialized views"],
    accent: "#fbbf24",
  },
  {
    slug: "treinamento-corporativo",
    icon: GraduationCap,
    title: "Treinamento Corporativo",
    blurb:
      "Capacitação onsite ou híbrida em Big Data, Lakehouse, ClickHouse e IA. 100+ profissionais formados.",
    keywords: ["In Company", "Workshop", "Capacitação", "Big Data"],
    accent: "#22c55e",
  },
];

export default function ServicosPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <PageHeader
          eyebrow="Serviços"
          size="md"
          title={
            <>
              Engenharia de Dados em produção,
              <br />
              <span className="text-brand-gradient">do diagnóstico ao deploy.</span>
            </>
          }
          intro={
            <p>
              Cinco frentes onde a Azuris atua hoje. Todas com cases reais,
              KPIs verificáveis e foco em entregar valor de negócio — não
              plataforma vazia.
            </p>
          }
        />

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SERVICOS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.slug}
                  href={`/servicos/${s.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate/60 bg-deep p-6 md:p-8 hover:border-cyan-brand/60 hover:shadow-2xl hover:shadow-cyan-brand/5 transition-all"
                >
                  <div
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ background: s.accent }}
                  />

                  <div className="flex items-start gap-4 mb-4">
                    <span
                      className="inline-flex items-center justify-center size-12 rounded-xl shrink-0"
                      style={{
                        backgroundColor: `${s.accent}1f`,
                        color: s.accent,
                      }}
                    >
                      <Icon className="size-6" strokeWidth={2} />
                    </span>
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
                        {s.title}
                      </h2>
                      <p className="text-sm md:text-base text-foam/75 leading-relaxed">
                        {s.blurb}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-6 ml-16">
                    {s.keywords.map((k) => (
                      <span
                        key={k}
                        className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate/50 text-foam/50"
                      >
                        {k}
                      </span>
                    ))}
                  </div>

                  <div className="ml-16 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-brand">
                    Saber mais
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Helper block — quick FAQ */}
          <section className="mt-16 border-t border-slate/40 pt-10">
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Em dúvida sobre por onde começar?
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
              Cenários comuns.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  q: "Conta de cloud crescendo acima do uso",
                  a: "Comece pelo Redução de Custo. Em 1-2 semanas mapeamos onde escapa dinheiro.",
                  href: "/servicos/reducao-custo-big-data",
                },
                {
                  q: "Não temos Data Lake e o volume cresceu",
                  a: "Construção de Data Lake. 90 dias do zero ao primeiro caso em produção.",
                  href: "/servicos/construcao-data-lake",
                },
                {
                  q: "Cluster Hadoop on-premise envelhecendo",
                  a: "Migração de Dados. Plano de ondas, dual-run, zero downtime visível.",
                  href: "/servicos/migracao-de-dados",
                },
                {
                  q: "Dashboard lento + Snowflake/BigQuery caro",
                  a: "ClickHouse. Sub-segundo em workload contínuo, custo previsível.",
                  href: "/servicos/clickhouse",
                },
                {
                  q: "Time interno precisa nivelar conhecimento",
                  a: "Treinamento Corporativo. Programa onsite com cases reais.",
                  href: "/servicos/treinamento-corporativo",
                },
                {
                  q: "Não sei qual serviço se encaixa",
                  a: "Conversa de 30 minutos no WhatsApp. A gente te ajuda a identificar.",
                  href: "/contato",
                },
              ].map((item) => (
                <Link
                  key={item.q}
                  href={item.href}
                  className="group rounded-xl border border-slate/50 bg-deep/60 p-5 hover:border-cyan-brand/50 transition-colors"
                >
                  <h3 className="text-base font-semibold mb-2 group-hover:text-cyan-brand transition-colors">
                    {item.q}
                  </h3>
                  <p className="text-sm text-foam/70 leading-relaxed">
                    {item.a}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <div className="mx-auto max-w-5xl px-6 pb-8">
          <CourseCallout />
        </div>

        <Cta />
      </main>
      <Footer />
    </>
  );
}
