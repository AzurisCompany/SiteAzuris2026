import type { Metadata } from "next";
import { ServiceLanding } from "@/components/ServiceLanding";

export const metadata: Metadata = {
  title:
    "ClickHouse no Brasil — Implantação e Capacitação em OLAP de Alta Performance",
  description:
    "Implementamos ClickHouse do zero ou como alternativa moderna a Snowflake/BigQuery. Banco analítico columnar para dashboards sub-segundo, telemetria, logs e produtos analíticos.",
  keywords: [
    "ClickHouse Brasil",
    "consultoria ClickHouse",
    "implementação ClickHouse",
    "ClickHouse alternativa Snowflake",
    "ClickHouse vs BigQuery",
    "OLAP moderno",
    "banco analítico colunar",
  ],
  openGraph: {
    title: "ClickHouse no Brasil — Implantação e Capacitação",
    description:
      "OLAP columnar de alta performance. Alternativa a Snowflake/BigQuery quando custo e latência importam.",
    type: "website",
  },
  alternates: { canonical: "/servicos/clickhouse" },
};

export default function ClickHousePage() {
  return (
    <ServiceLanding
      slug="clickhouse"
      eyebrow="Serviço · ClickHouse"
      serviceName="ClickHouse — Implantação e Capacitação"
      serviceDescription="Implantação de ClickHouse como alternativa a Snowflake/BigQuery em workloads contínuos de alta cadência e baixa latência. Capacitação técnica do time interno."
      h1={
        <>
          <span className="text-brand-gradient">ClickHouse</span> em produção
          <br />
          para quando dashboard não pode demorar.
        </>
      }
      subtitle="Substitua queries lentas em Athena/Snowflake/BigQuery por OLAP columnar de alta performance. Implantação, modelagem, materialized views e capacitação do time — do zero ao primeiro produto analítico em ~60 dias."
      pain={{
        heading: "Quando ClickHouse passa a fazer sentido",
        body:
          "Workload contínuo de query, dashboard que precisa abrir em sub-segundo, telemetria/logs em escala, produto analítico consumido por usuário final. Em todos esses, Snowflake e BigQuery viram conta gigante — e ClickHouse vira a escolha óbvia.",
        bullets: [
          "Dashboards executivos lentos (10s+ pra abrir, recarregam várias vezes ao dia)",
          "Conta de BigQuery/Snowflake estourando com workload de telemetria, logs ou eventos de produto",
          "Produto analítico consumido por cliente final com SLA de latência (< 1s)",
          "Stream de eventos do Kafka/Redpanda chegando mais rápido que warehouse aguenta",
          "Necessidade de custo previsível (mensal fixo, não variável por query)",
        ],
      }}
      delivery={{
        heading: "O que entregamos",
        body:
          "ClickHouse implantado em produção (auto-hospedado, ClickHouse Cloud ou Altinity), modelado pro workload do cliente, integrado à pipeline existente e com time interno capacitado pra operar com autonomia.",
        bullets: [
          {
            title: "Implantação correta",
            text: "ClickHouse self-hosted (VM/K8s) ou gerenciado (ClickHouse Cloud, Altinity). Configuração tunada pro workload.",
          },
          {
            title: "Modelagem para alta cadência",
            text: "MergeTree configurado por particionamento, ordenação, materialized views e projections.",
          },
          {
            title: "Ingestão em streaming",
            text: "Kafka Engine ou Kafka Connect direto pro ClickHouse. Reprocessamento idempotente.",
          },
          {
            title: "Materialized views agressivas",
            text: "Agregações pré-computadas pros dashboards mais consultados. Latência sub-segundo.",
          },
          {
            title: "Integração com BI",
            text: "Power BI, Grafana, Metabase, Superset — driver oficial, dashboard rodando em produção.",
          },
          {
            title: "Capacitação do time",
            text: "Workshop de 16h pra time de engenharia ou DBA: arquitetura, query, tuning, operação.",
          },
        ],
      }}
      how={{
        heading: "Como funciona o projeto",
        steps: [
          {
            title: "Avaliação técnica",
            text:
              "1-2 semanas: análise do workload atual, dimensionamento de cluster, escolha de modelo de hospedagem (self vs Cloud vs Altinity).",
          },
          {
            title: "Implantação e modelagem",
            text:
              "3-4 semanas: ClickHouse rodando em produção, modelo de dados desenhado pro workload, primeiro pipeline de ingestão.",
          },
          {
            title: "Migração de workload",
            text:
              "4-6 semanas: workloads críticos migrados de Snowflake/BigQuery/Athena pra ClickHouse, com dual-run e validação.",
          },
          {
            title: "Capacitação e handover",
            text:
              "2-3 semanas: workshop com o time interno, documentação operacional, plano de monitoramento e backup.",
          },
        ],
      }}
      outcome={{
        heading: "O que ficou medido",
        body:
          "ClickHouse rodando em produção servindo dashboards e produtos analíticos com latência sub-segundo. Custo mensal previsível, time interno capacitado, queries que demoravam 30-60s agora respondem em 1-2s.",
        kpis: [
          { value: "< 1s", label: "latência típica de dashboard" },
          { value: "60-80%", label: "economia vs Snowflake/BigQuery (workload contínuo)" },
          { value: "~60 dias", label: "primeiro produto em produção" },
          { value: "16h", label: "capacitação do time" },
        ],
      }}
      tech={[
        "ClickHouse",
        "Kafka",
        "Redpanda",
        "Apache Iceberg",
        "Grafana",
        "Airflow",
        "dbt",
        "Power BI",
      ]}
      relatedCases={[
        {
          slug: "logcomex-lakehouse",
          client: "Logcomex",
          tagline:
            "ClickHouse abordado em programa de capacitação como camada de consumo rápida do Lakehouse.",
        },
      ]}
      relatedPosts={[
        {
          slug: "clickhouse-vs-snowflake-vs-bigquery",
          title:
            "ClickHouse vs Snowflake vs BigQuery: quando escolher cada um",
        },
        {
          slug: "custos-big-data-7-pontos",
          title:
            "Custos de Big Data fora de controle? 7 pontos que escapam dinheiro",
        },
      ]}
    />
  );
}
