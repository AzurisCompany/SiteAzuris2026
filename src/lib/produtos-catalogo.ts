// Catálogo de marketing dos produtos do ecossistema Azuris.
// Usado nas sub-páginas /produtos/[slug] — resumo rápido + link pro site do produto.
// NÃO confundir com lib/produtos.ts (registry de preço/checkout Asaas).

export type Destaque = { titulo: string; texto: string };

export interface ProdutoCatalogo {
  slug: string;
  nome: string;
  emoji: string;
  /** eyebrow / categoria curta */
  categoria: string;
  /** frase de efeito curta (vira parte do <title> e do H1) */
  tagline: string;
  /** 1 parágrafo: o que é, em PT-BR direto */
  resumo: string;
  /** 3-4 diferenciais */
  destaques: Destaque[];
  /** para quem é */
  publico: string;
  /** URL do site do produto */
  site: string;
  /** host limpo exibido no botão/rodapé */
  siteHost: string;
  /** rótulo do CTA principal */
  ctaLabel: string;
  badge?: string;
}

export const CATALOGO: ProdutoCatalogo[] = [
  {
    slug: "ttspeak",
    nome: "TTSpeak",
    emoji: "🎥",
    categoria: "Plataforma · Vídeo",
    tagline: "Videochamada com superpoderes de facilitação.",
    resumo:
      "Plataforma de videochamada feita pra quem facilita: aula, treinamento, dinâmica de grupo. Entra por link, sem instalar app, e o facilitador controla a sala em tempo real. Dá pra usar com a sua marca (white-label) e integrar com LMS e CRM.",
    destaques: [
      {
        titulo: "Entra por link",
        texto: "Sem app, sem cadastro pesado. A sala abre numa URL curta.",
      },
      {
        titulo: "Breakout inteligente",
        texto: "Salas com rodízio automático e arrastar-soltar de participantes.",
      },
      {
        titulo: "Equilíbrio de fala",
        texto: "Vê quem falou quanto, modera ao vivo e fecha com relatório.",
      },
      {
        titulo: "White-label + integrações",
        texto: "Sua marca, transcrição por locutor, LMS/CRM — e serious games.",
      },
    ],
    publico:
      "Escolas e cursos de idiomas, treinamento corporativo, RH e plataformas de EdTech.",
    site: "https://ttspeak.com.br",
    siteHost: "ttspeak.com.br",
    ctaLabel: "Pedir uma demonstração",
    badge: "Novo",
  },
  {
    slug: "polenai",
    nome: "PolenAI",
    emoji: "🐝",
    categoria: "Software · Marketing AI-first",
    tagline: "Descreve a campanha. A IA monta o resto.",
    resumo:
      "Plataforma de marketing AI-first. Você descreve em português o que quer comunicar e a IA gera a campanha inteira — e-mail, landing page, post de social, segmentação e automação — multi-canal e já com a sua voz de marca. Validação de entregabilidade e LGPD vêm embutidas.",
    destaques: [
      {
        titulo: "Brief em português",
        texto: "Descreve em linguagem natural; a IA constrói o material pronto.",
      },
      {
        titulo: "Multi-canal",
        texto: "E-mail, landing, WhatsApp, Instagram, LinkedIn e WordPress.",
      },
      {
        titulo: "IA à sua escolha",
        texto: "Claude, GPT ou Gemini — com tom e voz de marca aplicados.",
      },
      {
        titulo: "LGPD e entregabilidade",
        texto: "Double opt-in, central de preferências e validação antes do envio.",
      },
    ],
    publico:
      "Times de marketing que precisam de velocidade sem depender de design ou dev.",
    site: "https://polenai.com.br",
    siteHost: "polenai.com.br",
    ctaLabel: "Conhecer a PolenAI",
    badge: "Novo",
  },
  {
    slug: "pipezeroone",
    nome: "PipeZeroOne",
    emoji: "⚡",
    categoria: "Software · CRM AI-first",
    tagline: "Seu pipeline acordou.",
    resumo:
      "CRM AI-first pra time comercial. A IA enriquece o lead, cria o cadastro a partir de texto, e-mail ou voz, escreve a proposta e prioriza o pipeline por score — você foca em fechar. E não inventa dado: o que não foi verificado fica em branco.",
    destaques: [
      {
        titulo: "Lead por voz ou texto",
        texto: "Cria e enriquece o cadastro a partir de texto, e-mail ou voz.",
      },
      {
        titulo: "Proposta gerada por IA",
        texto: "A IA pesquisa a empresa e escreve a proposta comercial.",
      },
      {
        titulo: "Score e priorização",
        texto: "Pipeline ordenado pelo que tem mais chance de fechar.",
      },
      {
        titulo: "Kanban + RD Station",
        texto: "Arrastar-soltar, ações em massa, mobile e integração RD.",
      },
    ],
    publico:
      "Times comerciais que querem menos trabalho administrativo e mais fechamento.",
    site: "https://pipezeroone.com.br",
    siteHost: "pipezeroone.com.br",
    ctaLabel: "Testar grátis",
    badge: "Novo",
  },
  {
    slug: "english-talk-time",
    nome: "English Talk Time",
    emoji: "🗣️",
    categoria: "Programa · Idiomas",
    tagline: "Inglês com IA, feito pra quem vive de tech.",
    resumo:
      "Programa de aceleração de inglês para profissionais de tecnologia, dados, IA e BI — gente que entende razoavelmente, mas trava na hora de falar. Combina grupo de conversação, ferramentas com IA e uma rotina diária estruturada.",
    destaques: [
      {
        titulo: "Metodologia com foco",
        texto: "Prioriza as ~3.000 palavras que mais aparecem no dia a dia tech.",
      },
      {
        titulo: "Comunidade tech",
        texto: "Prática real entre profissionais, no ecossistema DSSBR & GUBigData.",
      },
      {
        titulo: "IA + gamificação",
        texto: "Identifica suas lacunas e gera flashcards sob medida.",
      },
      {
        titulo: "Encontros ao vivo",
        texto: "Online toda segunda e presencial em Curitiba.",
      },
    ],
    publico:
      "Profissionais de tech, dados, BI e engenharia mirando carreira internacional.",
    site: "https://englishtalktime.com.br",
    siteHost: "englishtalktime.com.br",
    ctaLabel: "Participar de um encontro grátis",
  },
  {
    slug: "oworkshop",
    nome: "OWorkshop",
    emoji: "🛠️",
    categoria: "Workshop · IA para empresas",
    tagline: "Workshops práticos. Sem firula, sem PowerPoint.",
    resumo:
      "Workshop presencial de 16 horas (2 dias) que capacita profissionais e empresas a implementar IA no negócio — do fundamento à estratégia. Dia 1: fundamentos e aplicações. Dia 2: implementação, infraestrutura, ética e oportunidades sob medida.",
    destaques: [
      {
        titulo: "16h, mão na massa",
        texto: "Dois dias presenciais com atividades hands-on, não slides.",
      },
      {
        titulo: "Especialistas de verdade",
        texto: "Engenheiros de Big Data e líderes tech com 30+ anos de estrada.",
      },
      {
        titulo: "Aplicação imediata",
        texto: "Sai com oportunidades de IA mapeadas pro seu próprio negócio.",
      },
      {
        titulo: "Bônus de consultoria",
        texto: "1 hora de consultoria gratuita com os especialistas.",
      },
    ],
    publico:
      "Empresas e profissionais que querem entender e implementar IA com vantagem competitiva.",
    site: "https://oworkshop.com.br",
    siteHost: "oworkshop.com.br",
    ctaLabel: "Ver datas e inscrição",
  },
];

export function getProdutoCatalogo(slug: string): ProdutoCatalogo | undefined {
  return CATALOGO.find((p) => p.slug === slug);
}

export function getAllProdutoSlugs(): string[] {
  return CATALOGO.map((p) => p.slug);
}
