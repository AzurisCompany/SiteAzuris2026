import type { Metadata } from "next";
import { ServiceLanding } from "@/components/ServiceLanding";

export const metadata: Metadata = {
  title:
    "Construção de Data Lake — Arquitetura Lakehouse pronta para produção",
  description:
    "Construímos Data Lakes do zero com arquitetura Medallion (Bronze/Silver/Gold), Apache Iceberg, Delta Lake, Spark e Airflow. Da primeira fonte ao primeiro dashboard em 90 dias.",
  keywords: [
    "construção data lake",
    "construir data lake",
    "arquitetura lakehouse",
    "arquitetura medallion",
    "data lake do zero",
    "implementação data lake Brasil",
    "consultoria data lake",
  ],
  openGraph: {
    title:
      "Construção de Data Lake — Lakehouse moderno pronto para produção",
    description:
      "Arquitetura Medallion com Iceberg, Delta, Spark e Airflow. Da fonte ao dashboard em 90 dias.",
    type: "website",
  },
  alternates: { canonical: "/servicos/construcao-data-lake" },
};

export default function ConstrucaoDataLakePage() {
  return (
    <ServiceLanding
      slug="construcao-data-lake"
      eyebrow="Serviço · Construção de Data Lake"
      serviceName="Construção de Data Lake"
      serviceDescription="Construção de Data Lake do zero com arquitetura Lakehouse moderna (Medallion + Iceberg/Delta), entregue em 90 dias."
      h1={
        <>
          Construção de <span className="text-brand-gradient">Data Lake</span>
          <br />
          do zero — pronto para produção.
        </>
      }
      subtitle="Arquitetura Lakehouse moderna (Medallion + Apache Iceberg), entregue em 90 dias. Da primeira fonte ao primeiro dashboard, com governança, qualidade e custo controlado desde o dia 1."
      pain={{
        heading: "Quando faz sentido começar agora",
        body:
          "Empresa atinge o ponto em que planilhas e bancos de aplicação não aguentam mais o volume e a diversidade de fontes. Cada área tem sua versão da 'verdade', dashboard demora dias pra ser atualizado, decisão de board é tomada com dado de duas semanas atrás.",
        bullets: [
          "5+ fontes de dados que precisam conversar (ERP, CRM, eventos, planilhas, APIs externas)",
          "Time analítico esperando dia/semana pra um dado novo entrar no relatório",
          "Necessidade de guardar dado bruto pra auditoria, reprocessamento ou IA",
          "Volume crescendo mais rápido que data warehouse atual aguenta",
        ],
      }}
      delivery={{
        heading: "O que entregamos",
        body:
          "Data Lake completo seguindo padrão Medallion (Raw → Bronze → Silver → Gold), com tecnologias open-source e cloud-friendly. Sem lock-in pesado de fornecedor, com governança e qualidade desde o primeiro dia.",
        bullets: [
          {
            title: "Storage organizado",
            text: "S3/GCS/MinIO com lifecycle policy desde o dia 1 (storage caro só pra dado quente).",
          },
          {
            title: "Formato moderno",
            text: "Apache Iceberg ou Delta Lake — ACID, schema evolution, time-travel, partition evolution.",
          },
          {
            title: "Camadas Medallion",
            text: "Raw (cru), Bronze (cru otimizado), Silver (limpo), Gold (pronto pro negócio).",
          },
          {
            title: "Ingestão moderna",
            text: "Airbyte ou NiFi para ingestão; Kafka/Redpanda quando há necessidade de streaming.",
          },
          {
            title: "Orquestração",
            text: "Apache Airflow com retries, SLAs, alertas e contingência configurados.",
          },
          {
            title: "Qualidade automatizada",
            text: "Great Expectations entre as camadas. Dado quebrado não passa pra Silver.",
          },
          {
            title: "Catálogo + governança",
            text: "Open Metadata, Polaris ou Unity Catalog. Lineage, RBAC, audit log.",
          },
          {
            title: "Primeiro dashboard real",
            text: "Power BI, Looker ou Metabase consumindo Gold. Não 'plataforma vazia'.",
          },
        ],
      }}
      how={{
        heading: "Como funciona o projeto",
        steps: [
          {
            title: "Discovery e priorização",
            text:
              "2 semanas: mapeamento de fontes, casos de uso, donos no negócio, prazos. Escolha do MVP — 1 caso fim a fim.",
          },
          {
            title: "Fundação cloud",
            text:
              "4-8 semanas: storage, IAM, formato de tabela, primeiro pipeline ETL, primeiro dashboard. Já em produção.",
          },
          {
            title: "Expansão",
            text:
              "8-16 semanas: ingestão de mais fontes, validações, catálogo, alertas, documentação viva.",
          },
          {
            title: "Maturidade e transferência",
            text:
              "4-6 semanas: time interno operando com autonomia, playbook documentado, suporte estendido opcional.",
          },
        ],
      }}
      outcome={{
        heading: "O que ficou medido",
        body:
          "Data Lake em produção em 90 dias com 1 caso de uso real entregue, time interno capacitado pra operar e roadmap claro pros próximos 6 meses. Custo previsível desde a primeira semana.",
        kpis: [
          { value: "90 dias", label: "primeiro caso em produção" },
          { value: "100%", label: "open-source / open-format" },
          { value: "0", label: "lock-in pesado de fornecedor" },
          { value: "2-3", label: "pessoas mínimo de time interno" },
        ],
      }}
      tech={[
        "Apache Iceberg",
        "Delta Lake",
        "Airflow",
        "Spark",
        "dbt",
        "Great Expectations",
        "Trino",
        "ClickHouse",
        "Airbyte",
      ]}
      relatedCases={[
        {
          slug: "logcomex-lakehouse",
          client: "Logcomex",
          tagline:
            "Time de dados pronto para escalar — sem quebrar produção. Capacitação em Big Data e Lakehouse.",
        },
      ]}
      relatedPosts={[
        {
          slug: "como-construir-data-lake-do-zero",
          title:
            "Como construir um Data Lake do zero — arquitetura Medallion explicada",
        },
        {
          slug: "data-lake-em-2026",
          title:
            "Data Lake em 2026: o que é, quando faz sentido, quanto custa",
        },
        {
          slug: "lakehouse-delta-vs-iceberg",
          title: "Lakehouse em 2026: Delta Lake vs Apache Iceberg",
        },
      ]}
    />
  );
}
