import type { Metadata } from "next";
import { ServiceLanding } from "@/components/ServiceLanding";

export const metadata: Metadata = {
  title:
    "Migração de Dados sem Downtime — Hadoop on-premise para Cloud",
  description:
    "Migração de plataformas de dados (Hadoop, Oracle, on-premise) para AWS, GCP ou Azure com zero parada de operação. Case real: 100 TB migrados, -40% de OpEx, sem perda de relatório.",
  keywords: [
    "migração de dados",
    "migrar hadoop cloud",
    "migração on-premise para cloud",
    "migração OCI para GCP",
    "migração dados sem downtime",
    "consultoria migração big data",
  ],
  openGraph: {
    title: "Migração de Dados sem Downtime — Hadoop para Cloud",
    description:
      "100 TB migrados sem perder um segundo de operação. -40% de OpEx mensal.",
    type: "website",
  },
  alternates: { canonical: "/servicos/migracao-de-dados" },
};

export default function MigracaoDeDadosPage() {
  return (
    <ServiceLanding
      slug="migracao-de-dados"
      eyebrow="Serviço · Migração de Dados"
      serviceName="Migração de Dados sem Downtime"
      serviceDescription="Migração de plataformas de dados (Hadoop, Oracle, on-premise) para Cloud com zero parada de operação."
      h1={
        <>
          <span className="text-brand-gradient">Migração de Dados</span>
          <br />
          sem perder um segundo de operação.
        </>
      }
      subtitle="Cluster Hadoop on-premise envelhecendo? Oracle Cloud caindo mês a mês? Já migramos 100 TB para GCP sem um segundo de downtime visível pro negócio. Sem mágica — com plano de ondas, contingência e dual-run."
      pain={{
        heading: "O ponto em que migrar deixa de ser opcional",
        body:
          "Hardware envelhece, contrato de manutenção sobe, time interno encolhe e o concorrente já está em cloud virando produto em cima do dado. Migrar é a parte difícil — derrubar relatório de CEO durante a transição é o que paralisa o projeto.",
        bullets: [
          "Cluster Hadoop on-premise em hardware vencendo contrato",
          "Conta da Oracle Cloud / nuvem atual crescendo acima do retorno",
          "Time interno encolheu, ninguém quer cuidar de cluster físico",
          "Compliance/auditoria pedindo cloud regulamentada",
          "Concorrente migrou e está mais rápido em entrega de dado",
        ],
      }}
      delivery={{
        heading: "O que entregamos",
        body:
          "Migração completa em ondas planejadas, com dual-run, validação de hash arquivo a arquivo e contingência por etapa. Plus modernização da arquitetura no destino — não 'levanta igual ao on-prem', moderniza enquanto migra.",
        bullets: [
          {
            title: "Plano de ondas",
            text: "Tabelas e consumidores organizados em ondas independentes. Cada onda entrega valor sozinha.",
          },
          {
            title: "Dual-write durante transição",
            text: "Por 2-4 semanas, dado entra no on-prem e na cloud em paralelo. Comparamos diariamente.",
          },
          {
            title: "Hash arquivo a arquivo",
            text: "Cada Parquet do on-prem tem hash gravado. Hash da cloud confere antes de qualquer DELETE.",
          },
          {
            title: "Plano de rollback",
            text: "Cada onda tem comando de desfazer documentado. CTO consegue voltar atrás em 1h.",
          },
          {
            title: "Inventário de consumidores",
            text: "Cada Power BI, notebook, DAG e API que lê do cluster é mapeado antes de mexer no destino.",
          },
          {
            title: "Modernização no destino",
            text: "MapReduce → Spark, Hive ACID → Iceberg, formato cru → Parquet otimizado. Migra ganhando.",
          },
        ],
      }}
      how={{
        heading: "Como funciona o projeto",
        steps: [
          {
            title: "Assessment (3-4 semanas)",
            text:
              "Mapeamento de tabelas, jobs, consumidores e tecnologia. Análise de uso pra identificar tabelas zumbis (em geral 30-50% não tem consulta há > 6 meses).",
          },
          {
            title: "Fundação cloud (4-8 semanas)",
            text:
              "Storage, IAM, catálogo, engine de query, primeiro pipeline ETL completo. 1 caso de uso de referência rodando ponta-a-ponta.",
          },
          {
            title: "Migração em ondas (3-6 meses)",
            text:
              "Cada onda tem 4 etapas: copiar dado, validar consistência, apontar consumidores, dual-run de 1-2 semanas.",
          },
          {
            title: "Decomissionamento (4-6 semanas)",
            text:
              "On-prem desativado onda por onda com backup final em cold storage. Documentação completa no catálogo da cloud.",
          },
        ],
      }}
      outcome={{
        heading: "O que ficou medido",
        body:
          "No case da RD Station: 100 TB migrados em ~12 meses, zero downtime visível pra operação, 40% de redução na conta mensal e cluster reduzido de 35 pra 18 servidores no destino. +25% de performance no que ficou.",
        kpis: [
          { value: "100 TB", label: "migrados (RD Station)" },
          { value: "0", label: "downtime visível" },
          { value: "-40%", label: "OpEx mensal" },
          { value: "+25%", label: "performance pós-migração" },
        ],
      }}
      tech={[
        "Hadoop",
        "Spark",
        "Apache Iceberg",
        "GCP",
        "AWS",
        "Snowflake",
        "Airflow",
        "Trino",
      ]}
      relatedCases={[
        {
          slug: "rdstation-migracao-100tb",
          client: "RD Station",
          tagline:
            "100 TB migrados de nuvem sem perder um segundo de operação. -40% de OpEx mensal.",
        },
      ]}
      relatedPosts={[
        {
          slug: "migrar-hadoop-para-cloud",
          title:
            "Como migrar de Hadoop on-premise para Cloud sem perder um dado",
        },
        {
          slug: "hadoop-em-2026",
          title: "Hadoop em 2026: morreu? Não — mudou de papel",
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
