import type { Metadata } from "next";
import { ServiceLanding } from "@/components/ServiceLanding";

export const metadata: Metadata = {
  title:
    "Treinamento Corporativo em Big Data e IA — Onsite e In Company",
  description:
    "Capacitação corporativa em Big Data, Lakehouse, ClickHouse e IA. Programa onsite ou híbrido, com conteúdo personalizado pro contexto do cliente. Já capacitamos 100+ profissionais.",
  keywords: [
    "treinamento big data in company",
    "treinamento engenharia de dados corporativo",
    "capacitação big data empresa",
    "treinamento ClickHouse",
    "treinamento Lakehouse",
    "curso big data empresarial",
    "workshop in company dados",
  ],
  openGraph: {
    title: "Treinamento Corporativo em Big Data e IA",
    description:
      "Capacitação onsite ou híbrida com conteúdo personalizado pro contexto do cliente.",
    type: "website",
  },
  alternates: { canonical: "/servicos/treinamento-corporativo" },
};

export default function TreinamentoCorporativoPage() {
  return (
    <ServiceLanding
      slug="treinamento-corporativo"
      eyebrow="Serviço · Treinamento Corporativo"
      serviceName="Treinamento Corporativo em Big Data e IA"
      serviceDescription="Programa de capacitação onsite ou híbrida em Big Data, Lakehouse, ClickHouse e IA, personalizado pro contexto e arquitetura do cliente."
      h1={
        <>
          <span className="text-brand-gradient">Treinamento Corporativo</span>
          <br />
          em Big Data, Lakehouse e IA.
        </>
      }
      subtitle="Programa in company personalizado pro contexto do cliente. Conteúdo aplicado a problemas reais da arquitetura interna, com cases que rodamos, demonstrações ao vivo e laboratórios guiados. Já capacitamos 100+ profissionais em times diferentes."
      pain={{
        heading: "Por que capacitar internamente vence terceirizar",
        body:
          "Toda área de dados que cresce chega ao ponto em que o conhecimento da consultoria precisa virar conhecimento da casa. Sem isso, o time fica refém do fornecedor pra cada mudança e a velocidade de evolução despenca.",
        bullets: [
          "Time interno apagando incêndio sem horas pra aprender nova tecnologia",
          "Engenharia evoluindo arquitetura mais lento que negócio precisa",
          "Dependência de consultoria pra cada decisão arquitetural importante",
          "Conhecimento concentrado em 1-2 pessoas (risco de saída crítica)",
          "Múltiplas unidades de negócio com padrões diferentes de qualidade",
        ],
      }}
      delivery={{
        heading: "O que entregamos",
        body:
          "Programa estruturado em blocos teórico-demonstrativos, com laboratórios guiados, estudos de caso reais e suporte pós-treinamento. Conteúdo é destilado da experiência de projetos que rodamos — não slide de livro recém-publicado.",
        bullets: [
          {
            title: "Conteúdo personalizado",
            text: "Briefing inicial pra entender arquitetura, dores e maturidade do time. Programa adaptado.",
          },
          {
            title: "Formato flexível",
            text: "12h, 16h, 32h ou programas longos. Onsite, híbrido ou totalmente remoto.",
          },
          {
            title: "Conteúdo aplicado",
            text: "Discussão com casos reais do cliente, não exemplos genéricos. Time sai aplicando.",
          },
          {
            title: "Laboratórios guiados",
            text: "Hands-on com ambiente pré-configurado. Time sai conseguindo replicar o que aprendeu.",
          },
          {
            title: "Estudos de caso reais",
            text: "Cases que rodamos (Logcomex, RD Station) servem de referência prática.",
          },
          {
            title: "Material e gravação",
            text: "Slides, exercícios, vídeos gravados em ambiente de educação a distância. Time revisita depois.",
          },
          {
            title: "Suporte pós-treinamento",
            text: "30-90 dias de suporte por Slack/e-mail pra dúvidas reais que aparecem na semana seguinte.",
          },
          {
            title: "Certificado digital",
            text: "Certificado individual de conclusão para cada participante.",
          },
        ],
      }}
      how={{
        heading: "Como funciona o projeto",
        steps: [
          {
            title: "Briefing com a liderança",
            text:
              "Reunião com líderes de engenharia/dados pra entender contexto, arquitetura atual, dores e objetivos. Identificação dos participantes.",
          },
          {
            title: "Customização do programa",
            text:
              "Conteúdo ajustado pro stack do cliente. Materiais preparados com referências ao ambiente real.",
          },
          {
            title: "Execução",
            text:
              "Blocos teórico-demonstrativos + laboratórios + estudos de caso. Onsite (Curitiba, SP, BH ou onde for) ou remoto.",
          },
          {
            title: "Pós-treinamento",
            text:
              "30-90 dias de suporte pra dúvidas. Office hours periódico opcional. Acompanhamento da aplicação prática.",
          },
        ],
      }}
      outcome={{
        heading: "O que ficou medido",
        body:
          "Time interno capacitado e operando com autonomia, conhecimento distribuído entre múltiplas pessoas e capacidade de evoluir a plataforma sem depender de consultoria pra cada decisão.",
        kpis: [
          { value: "100+", label: "profissionais capacitados (Sicredi)" },
          { value: "12-32h", label: "carga horária típica" },
          { value: "NPS alto", label: "satisfação dos participantes" },
          { value: "30-90d", label: "suporte pós-treinamento" },
        ],
      }}
      tech={[
        "Lakehouse",
        "Apache Iceberg",
        "Delta Lake",
        "ClickHouse",
        "Airflow",
        "Spark",
        "dbt",
        "Great Expectations",
      ]}
      relatedCases={[
        {
          slug: "logcomex-lakehouse",
          client: "Logcomex",
          tagline:
            "Time de dados pronto para escalar — sem quebrar produção. Programa onsite de Big Data e Lakehouse.",
        },
        {
          slug: "sicredi-treinamento",
          client: "Sicredi",
          tagline:
            "Mais de 100 profissionais alinhados em uma única forma de trabalhar com dados.",
        },
      ]}
      relatedPosts={[
        {
          slug: "workshop-ia-para-gestores",
          title: "Workshop de IA para gestores: roteiro de 16 horas",
        },
        {
          slug: "como-construir-data-lake-do-zero",
          title:
            "Como construir um Data Lake do zero — arquitetura Medallion explicada",
        },
      ]}
    />
  );
}
