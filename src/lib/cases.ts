// Catálogo de cases publicados em /cases/[slug].
// Cada case é uma estrutura tipada (não MDX) pra renderizar com componentes
// próprios — diagramas, tabelas, KPIs e galeria entram nativos no design.

export type CaseKpi = { value: string; label: string };

export type CaseTool = {
  name: string;
  hours?: string;
  blurb: string;
  /** uso prático recomendado pra arquitetura do cliente */
  fit?: string;
};

export type CasePhoto = {
  src: string;
  alt: string;
  caption?: string;
};

export type CaseSection = {
  heading: string;
  body?: string;
  bullets?: { title: string; text: string }[];
};

export type CaseDetail = {
  slug: string;
  client: string;
  title: string;
  tagline: string;
  /** YYYY-MM..YYYY-MM ou "MM/YYYY – MM/YYYY" */
  period?: string;
  location?: string;
  role?: string;
  /** logo do cliente em /public, ex: /cases/logos/logcomex.svg */
  logo?: string;
  /** cor da marca (hex) */
  accent?: string;
  kpis?: CaseKpi[];
  tech?: string[];
  /** 1-2 parágrafos sobre o cliente — quem é, o que faz, mercado */
  companyBrief?: string[];
  /** Chamada do case — 2-3 parágrafos curtos antes do STAR */
  intro?: string[];
  /** STAR resumido — frases curtas, para audiência executiva */
  star?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  /** Depoimento estilo testimonial */
  quote?: {
    text: string;
    author: string;
    role: string;
  };
  summary: string;
  sections: CaseSection[];
  /** ferramentas com bloco didático (training cases) */
  tools?: CaseTool[];
  /** plano detalhado (training cases) */
  plan?: { title: string; items: string[] }[];
  photos?: CasePhoto[];
};

export const CASES: CaseDetail[] = [
  {
    slug: "logcomex-lakehouse",
    client: "Logcomex",
    title:
      "Capacitação em Big Data e Lakehouse para fortalecer a engenharia de dados",
    tagline:
      "Treinamento in company que conectou tecnologia, arquitetura e desenvolvimento de pessoas — base para uma plataforma de dados mais confiável e escalável.",
    period: "Out – Nov 2025",
    location: "Curitiba — onsite",
    role: "Data Engineer Trainer",
    logo: "/cases/logos/logcomex.svg",
    accent: "#6613D0",
    companyBrief: [
      "A Logcomex é uma empresa brasileira de tecnologia que atua no setor de comércio exterior, desenvolvendo soluções para tornar operações de importação, exportação e logística internacional mais inteligentes, integradas e eficientes. Nasceu no Paraná e se consolidou como referência em tecnologia para comércio exterior no Brasil, com expansão para a América Latina.",
      "Em um negócio baseado em dados, a capacidade de coletar, organizar, validar, processar e disponibilizar informações com qualidade é essencial. Para empresas como a Logcomex, os dados não são apenas suporte à operação: eles fazem parte do próprio produto, da tomada de decisão dos clientes e da inteligência de mercado entregue pela plataforma.",
    ],
    intro: [
      "A Logcomex, empresa referência em tecnologia para comércio exterior, precisava preparar seu time de Engenharia de Dados para evoluir uma arquitetura moderna baseada em Data Lakehouse — com mais qualidade, confiabilidade, governança e eficiência operacional.",
      "Para apoiar esse desafio, foi desenvolvido um treinamento in company voltado ao nivelamento técnico e à aplicação prática de ferramentas modernas de Big Data, Data Quality, pipelines, orquestração e arquitetura de dados.",
      "O trabalho abordou desafios reais da operação, como quebras em pipelines, validação de dados, escalabilidade, redução de custos e maior autonomia do time técnico.",
    ],
    star: {
      situation:
        "Em um mercado altamente dependente de informação, a Logcomex já operava sobre uma arquitetura Data Lakehouse madura — mas o crescimento da operação trazia desafios típicos: mais fontes, mais pipelines, mais produtos dependentes da plataforma, e a necessidade crescente de qualidade, governança e eficiência.",
      task: "Capacitar o time de Engenharia de Dados para lidar com uma arquitetura cada vez mais estratégica e complexa — reduzindo riscos operacionais, evitando retrabalho e aumentando a confiabilidade das informações que alimentam a plataforma.",
      action:
        "Treinamento in company estruturado para o contexto real da Logcomex, conectando cada tecnologia aos desafios concretos da arquitetura da empresa. Conteúdo, demonstrações, discussões técnicas, estudos de caso e troca de experiências.",
      result:
        "Capacitação que combinou conhecimento técnico, visão arquitetural e fortalecimento de time. Mais ferramentas e práticas para apoiar a evolução da plataforma — e um time mais alinhado, conectado e preparado para os próximos passos.",
    },
    quote: {
      text: "Voltamos desses dias com a cabeça cheia de ideias e o time mais unido do que nunca.",
      author: "Darci Schmidt Hort Junior",
      role: "Data Manager / Software Engineering Manager — Logcomex",
    },
    tech: [
      "Delta Lake",
      "Iceberg",
      "Airflow",
      "Spark",
      "dbt",
      "Airbyte",
      "NiFi",
      "Kafka",
      "Redpanda",
      "Trino/Starburst",
      "MinIO",
      "Great Expectations",
      "ClickHouse",
    ],
    summary:
      "Treinamento in company estruturado para o contexto real da Logcomex, com foco em Big Data, arquitetura Lakehouse, qualidade de dados, automação de pipelines, governança, escalabilidade e redução de custos operacionais.",
    sections: [
      {
        heading: "Situação",
        body: "A arquitetura de dados da Logcomex já seguia um modelo moderno de Data Lakehouse, utilizando Amazon S3 e Delta Lake como base. As informações vinham de diferentes fontes — HubSpot, PostgreSQL, Google Sheets e sites de comércio exterior coletados por crawlers — ingeridas com Airbyte e organizadas em camadas de tratamento. Para um público não técnico, essa estrutura pode ser entendida em quatro etapas:",
        bullets: [
          {
            title: "Raw",
            text: "Guarda os dados como eles chegam, sem alteração.",
          },
          {
            title: "Bronze",
            text: "Organiza os dados brutos para começarem a fazer sentido.",
          },
          {
            title: "Silver",
            text: "Limpa, valida e prepara os dados.",
          },
          {
            title: "Gold",
            text: "Entrega dados prontos para relatórios, análises, produtos digitais e decisões de negócio.",
          },
        ],
      },
      {
        heading: "Tarefa",
        body: "O desafio era capacitar o time de Engenharia de Dados para lidar com uma arquitetura cada vez mais estratégica. A proposta tinha cinco objetivos principais, todos com impacto direto em redução de risco, retrabalho e custo operacional:",
        bullets: [
          {
            title: "Nivelar conhecimento",
            text: "Alinhar a equipe em Big Data e arquitetura Lakehouse para acompanhar a evolução da plataforma.",
          },
          {
            title: "Apoiar novas práticas",
            text: "Acelerar a adoção de tecnologias e boas práticas modernas pelo time.",
          },
          {
            title: "Reduzir falhas",
            text: "Atacar a causa raiz das quebras em produção: problemas de qualidade de dados.",
          },
          {
            title: "Otimizar custos",
            text: "Apresentar alternativas concretas para reduzir o custo operacional da plataforma.",
          },
          {
            title: "Aumentar autonomia",
            text: "Dar ao time mais segurança para gerenciar pipelines complexos com eficiência.",
          },
        ],
      },
      {
        heading: "Ação",
        body: "A Azuris estruturou e conduziu um treinamento in company voltado ao contexto real da Logcomex. A proposta não foi apenas apresentar ferramentas, mas conectar cada tecnologia aos desafios concretos da arquitetura da empresa. O treinamento abordou a arquitetura atual, os pontos de dor, os caminhos de modernização e o papel de diferentes ferramentas no fortalecimento da plataforma. A abordagem foi ativa — demonstrações, discussões orientadas, estudos de caso, laboratórios guiados e desafios rápidos — aproximando o conteúdo técnico da realidade do time e facilitando a aplicação prática dos conceitos.",
      },
      {
        heading: "Resultado",
        body: "Uma capacitação que combinou conhecimento técnico, visão arquitetural e alinhamento de equipe. O time da Logcomex teve contato com ferramentas e práticas capazes de apoiar a evolução da plataforma em pontos críticos: qualidade, automação, governança, performance, redução de custos e confiabilidade dos pipelines. Mas o impacto foi além do técnico — incluiu fortalecimento do time, conexão entre as pessoas e novas ideias para evolução da plataforma de dados. Em síntese, o case mostra como uma capacitação bem direcionada pode gerar valor além da sala de aula: ao conectar tecnologia, arquitetura, desafios reais e desenvolvimento de pessoas, a Logcomex fortaleceu sua capacidade interna de evoluir uma plataforma de dados moderna, confiável e preparada para crescimento.",
      },
    ],
    tools: [
      {
        name: "Great Expectations",
        hours: "1h",
        blurb:
          "Ferramenta para criar testes automáticos de qualidade de dados. Na prática, ajuda a evitar que dados incompletos, inválidos ou fora do padrão avancem no pipeline e causem problemas em relatórios, sistemas ou produtos.",
        fit: "Testes automáticos antes de promover dados entre camadas do Lakehouse.",
      },
      {
        name: "Apache Airflow",
        hours: "1h",
        blurb:
          "Ferramenta de orquestração que organiza e monitora pipelines de dados. Funciona como uma central de controle: define quando cada processo deve rodar, o que fazer em caso de erro e como acompanhar a execução.",
        fit: "Coluna vertebral da orquestração entre Raw, Bronze, Silver e Gold.",
      },
      {
        name: "Apache Spark",
        hours: "1h",
        blurb:
          "Tecnologia de processamento distribuído para lidar com grandes volumes de dados. Útil quando os dados são grandes demais para serem processados de forma tradicional.",
        fit: "Motor de processamento entre as camadas do Lakehouse.",
      },
      {
        name: "dbt",
        hours: "1h",
        blurb:
          "Ferramenta que organiza transformações de dados com boas práticas de engenharia, documentação e versionamento.",
        fit: "Padronizar transformações analíticas com versionamento e testes.",
      },
      {
        name: "Apache NiFi",
        hours: "1h",
        blurb:
          "Ferramenta visual para criação de fluxos de dados. Automatiza integrações, movimenta dados entre sistemas e cria rotas para dados válidos e inválidos.",
        fit: "Roteamento e validação (válidos → S3, inválidos → quarentena) antes do Bronze.",
      },
      {
        name: "Kafka e Redpanda",
        hours: "1h",
        blurb:
          "Tecnologias de streaming de dados, usadas quando a empresa precisa trabalhar com eventos em tempo real ou quase real — atualizações contínuas vindas de sistemas, APIs ou fontes externas.",
        fit: "Captura de eventos de HubSpot e sites de comércio exterior em alta vazão.",
      },
      {
        name: "Apache Iceberg",
        hours: "1h",
        blurb:
          "Formato moderno de tabela para Data Lakes. Ajuda a controlar versões dos dados, evolução de schema, auditoria e consultas históricas.",
        fit: "Versionamento e auditoria para governança fim-a-fim no Lakehouse.",
      },
      {
        name: "MinIO",
        hours: "1h",
        blurb:
          "Armazenamento de objetos compatível com S3. Pode ser usado em cenários híbridos, on-premise ou como alternativa para reduzir dependência de nuvem pública.",
        fit: "Reduzir lock-in de nuvem e custo de storage em datasets pesados.",
      },
      {
        name: "Starburst / Trino",
        hours: "1h",
        blurb:
          "Motores de consulta SQL que permitem acessar dados em diferentes fontes sem precisar copiar tudo para um único lugar. Facilitam análises federadas e reduzem movimentação desnecessária de dados.",
        fit: "Substituir queries lentas em Athena/Redshift sem mover dados.",
      },
      {
        name: "ClickHouse",
        hours: "1h",
        blurb:
          "Banco analítico de alta performance, indicado para consultas rápidas sobre grandes volumes de dados. Pode ser usado em BI, métricas, logs, eventos e análises operacionais.",
        fit: "Camada de consumo rápida para dashboards, telemetria e produtos analíticos.",
      },
    ],
    photos: [
      {
        src: "/cases/logcomex/05.jpg",
        alt: "Turma do treinamento Logcomex em sala de aula, com slide de análise de código no telão",
        caption: "Aula em andamento — bloco de análise de código e estimativas.",
      },
      {
        src: "/cases/logcomex/03.jpg",
        alt: "Turma da Logcomex reunida na sala de treinamento com o logo da ClickHouse no telão",
        caption: "Bloco de ClickHouse — turma reunida na sede da Logcomex, em Curitiba.",
      },
      {
        src: "/cases/logcomex/01.jpg",
        alt: "Encerramento do treinamento Logcomex com turma posando em frente ao telão",
        caption: "Encerramento do treinamento — turma do programa de capacitação.",
      },
      {
        src: "/cases/logcomex/04.jpg",
        alt: "Time da Logcomex durante atividade de Team Building",
        caption: "Team Building — momento de integração do programa.",
      },
      {
        src: "/cases/logcomex/02.jpg",
        alt: "Time da Logcomex em outra atividade de Team Building",
        caption: "Atividade de integração — fortalecimento do time.",
      },
    ],
  },
];

export function getAllCases(): CaseDetail[] {
  return CASES;
}

export function getCaseBySlug(slug: string): CaseDetail | undefined {
  return CASES.find((c) => c.slug === slug);
}

export function getAllCaseSlugs(): string[] {
  return CASES.map((c) => c.slug);
}
