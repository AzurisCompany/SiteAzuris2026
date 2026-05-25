import type { Metadata } from "next";
import { ServiceLanding } from "@/components/ServiceLanding";

export const metadata: Metadata = {
  title:
    "Redução de Custo de Big Data — Como cortar 40% da conta de cloud",
  description:
    "Assessment técnico de plataforma analítica (Snowflake, Databricks, BigQuery, ClickHouse) que identifica 30-50% de gordura escondida. Casos reais de -40% de OpEx em produção.",
  keywords: [
    "redução de custo big data",
    "reduzir custo cloud",
    "FinOps dados",
    "otimização Snowflake",
    "otimização Databricks",
    "reduzir conta BigQuery",
    "auditoria custo dados",
  ],
  openGraph: {
    title: "Redução de Custo de Big Data — Corte 40% sem trocar fornecedor",
    description:
      "Assessment técnico que identifica 30-50% de gordura em Snowflake, Databricks, BigQuery e ClickHouse.",
    type: "website",
  },
  alternates: { canonical: "/servicos/reducao-custo-big-data" },
};

export default function ReducaoCustoBigDataPage() {
  return (
    <ServiceLanding
      slug="reducao-custo-big-data"
      eyebrow="Serviço · Redução de Custo de Big Data"
      serviceName="Redução de Custo de Big Data"
      serviceDescription="Assessment técnico de plataforma analítica e otimização para reduzir 30-50% do custo de Big Data sem trocar fornecedor."
      h1={
        <>
          Reduza 40% do custo de
          <br />
          <span className="text-brand-gradient">Big Data</span> sem trocar fornecedor.
        </>
      }
      subtitle="A conta da cloud cresceu acima do uso? Quase sempre é arquitetura desafinada — não 'a cloud é cara demais'. Faça o assessment antes de cortar projeto."
      pain={{
        heading: "Quando a conta vira preocupação",
        body:
          "Toda área de dados em cloud bate em uma curva onde o custo cresce mais rápido que o valor entregue. CFO pergunta, CTO promete revisar, mas o time já está apagando incêndio operacional e ninguém tem horas pra auditar.",
        bullets: [
          "Fatura da cloud crescendo 15-30% ao mês sem aumento equivalente de uso",
          "Snowflake/Databricks/BigQuery consumindo mais que metade do orçamento de TI",
          "Time de engenharia sem horas pra otimizar pipelines existentes",
          "Sensação de 'a gente paga muito' sem mapa do que escapa",
        ],
      }}
      delivery={{
        heading: "O que entregamos",
        body:
          "Assessment técnico de 1-2 semanas que produz mapa de gasto real, top 10 queries mais caras e roadmap priorizado com estimativa de economia por ponto.",
        bullets: [
          {
            title: "Mapa de gasto real",
            text: "Não o que o time acha — o que a fatura mostra, segmentado por workload, área e tabela.",
          },
          {
            title: "Top 10 queries caras",
            text: "20% das queries fazem 80% do custo. Identificamos quais e propomos reescrita.",
          },
          {
            title: "Audit de cluster e warehouse",
            text: "Clusters ociosos, warehouses superdimensionados, auto-scale calibrado errado.",
          },
          {
            title: "Roadmap priorizado",
            text: "Cada recomendação com estimativa de economia mensal e esforço de implementação.",
          },
          {
            title: "Lifecycle de storage",
            text: "Política de S3/GCS Standard → Infrequent Access → Glacier. Conta menor sem perder dado.",
          },
          {
            title: "Quick wins primeiro",
            text: "Recomendações que pagam o assessment em 30-60 dias antes de pensar em projeto pesado.",
          },
        ],
      }}
      how={{
        heading: "Como funciona o assessment",
        steps: [
          {
            title: "Kick-off e acesso",
            text:
              "1 semana: acordos de NDA, acesso read-only ao billing e console, mapeamento de stakeholders e dores prioritárias.",
          },
          {
            title: "Auditoria técnica",
            text:
              "1-2 semanas: análise de logs de query, monitoramento de cluster, análise de pipeline e revisão de armazenamento.",
          },
          {
            title: "Apresentação do relatório",
            text:
              "Workshop de 2-4 horas com liderança técnica: cada ponto com número de economia estimada e plano de ação.",
          },
          {
            title: "Execução (opcional)",
            text:
              "Quick wins implementados pelo time interno com suporte; projetos maiores entram em sprints separados.",
          },
        ],
      }}
      outcome={{
        heading: "O que ficou medido",
        body:
          "Em cliente recente, 40% de redução na conta mensal após migração + otimização. Em outro, plano de ação entregue ao time interno executar com pontos priorizados de economia. Sem trocar fornecedor.",
        kpis: [
          { value: "-40%", label: "custo mensal (RD)" },
          { value: "20-50%", label: "economia típica" },
          { value: "1-2 sem", label: "duração do assessment" },
          { value: "30-60d", label: "payback típico" },
        ],
      }}
      tech={[
        "Snowflake",
        "Databricks",
        "BigQuery",
        "ClickHouse",
        "Trino",
        "Airflow",
        "Spark",
        "dbt",
      ]}
      relatedCases={[
        {
          slug: "rdstation-migracao-100tb",
          client: "RD Station",
          tagline:
            "Migração crítica que cortou 40% da conta mensal sem assustar o negócio.",
        },
        {
          slug: "unimed-mentoria",
          client: "Unimed",
          tagline:
            "Diagnóstico técnico que separa onde escapa dinheiro e onde está a lentidão.",
        },
      ]}
      relatedPosts={[
        {
          slug: "custos-big-data-7-pontos",
          title: "Custos de Big Data fora de controle? 7 pontos que escapam dinheiro",
        },
        {
          slug: "clickhouse-vs-snowflake-vs-bigquery",
          title: "ClickHouse vs Snowflake vs BigQuery: quando escolher cada um",
        },
      ]}
    />
  );
}
