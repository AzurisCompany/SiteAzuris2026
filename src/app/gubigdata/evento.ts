// O encontro CORRENTE do GU BigData & IA — página, checkout e rota de API leem daqui.
//
// Todo encontro tem slug próprio (`gubigdata-AAAA-MM`, registrado em [[produtos]]):
// é o que mantém receita, lotação e aba do painel separadas de um encontro pro outro.
// Trocar de encontro = editar este arquivo + criar a entrada no registry + cadastrar
// os dois tipos de ingresso (`geral` pago, `associado` grátis) em /admin/ingressos.
// O encontro anterior sai do ar junto: /gubigdata é sempre o próximo, nunca um arquivo.

import type { EventoPresencial, MarcaEvento } from '@/lib/eventos/tipos'

export const EVENTO_GU_SLUG = 'gubigdata-2026-11'

/** Quem assina o evento: o grupo de usuários, não a Azuris (que só processa a inscrição). */
export const MARCA_GU: MarcaEvento = {
  nome: 'GU Big Data & IA',
  logo: '/gubigdata/logo-gu-bigdata.svg',
  corHeader: '#0A0F1C', // azul-marinho do site do GU — o logo tem traços brancos
  site: 'https://gubigdata.com.br',
  siteRotulo: 'site do GU BigData',
  etiqueta: 'Eventos da comunidade',
  sobre:
    'é o grupo de usuários de dados e inteligência artificial de Curitiba: encontros mensais, grupos de estudo e networking entre profissionais e entusiastas.',
}

export const EVENTO_GU = {
  slug: EVENTO_GU_SLUG,
  baseUrl: '/gubigdata',
  apiUrl: '/api/gubigdata/inscricao',
  tituloCurto: 'Encontro Presencial GU Big Data & IA',
  titulo:
    'Encontro Presencial GU Big Data & IA – 19 de novembro: Sua IA corporativa parou no chat? Agentes, automações e apps com o Amazon Quick',
  chamada: 'Do chat ao agente que acessa os dados da empresa — com demonstração ao vivo.',
  /** Tema curto do encontro — usado no card da /comunidade e no compartilhamento. */
  tema: 'Sua IA corporativa parou no chat? Agentes, automações e apps com o Amazon Quick',
  /** O encontro foi remarcado: a peça de divulgação leva selo "nova data". */
  novaData: false,
  /** "19 de novembro" — como o dia aparece no meio de um título. */
  dataTitulo: '19 de novembro',
  dataLonga: '19 de novembro de 2026, quinta',
  dataCurta: '19/11',
  inicio: '18h30',
  horario: '18h30 às 21h00',
  /** Descrição da página do evento (indexável) — não repetir data em texto solto. */
  metaDescricao:
    'Dia 19/11 às 18h30 no IEP, Curitiba: Iago Pimentel mostra ao vivo como sair do chat e criar agentes, automações e apps conectados aos dados da empresa com o Amazon Quick. GU BigData & IA + AWS User Group Curitiba. Ingresso Geral R$ 30 · gratuito para associados.',
  /** Descrição do checkout (noindex) — só o essencial pra quem já decidiu. */
  checkoutDescricao:
    'Encontro presencial do GU BigData & IA com o AWS User Group Curitiba em 19/11 no IEP, Curitiba. Ingresso Geral R$ 30 (PIX ou cartão em até 3x) ou gratuito para associados.',
  local: {
    sigla: 'IEP',
    nome: 'IEP — Instituto de Engenharia do Paraná',
    detalhe: 'Auditório do 2º andar',
    endereco: 'Rua Emiliano Perneta, 174 · Centro, Curitiba/PR',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=IEP+Instituto+de+Engenharia+do+Paran%C3%A1+Rua+Emiliano+Perneta+174+Curitiba',
  },
  banner: {
    src: '/gubigdata/banner-novembro.jpg',
    largura: 1672,
    altura: 941,
    alt: 'Encontro Presencial GU Big Data & IA — 19 de novembro: Sua IA corporativa parou no chat? Agentes, automações e apps com o Amazon Quick, com Iago Pimentel',
  },
  /** Parágrafos da seção "Descrição do evento" — texto puro (ver gotcha do SSR com <strong>). */
  descricao: [
    'Muita empresa já usa IA generativa, mas parou no chat: um assistente que não acessa os dados da empresa conhece pouco do negócio.',
    'Neste encontro, o GU BigData & IA e o AWS User Group Curitiba mostram como ir além: com conectores e servidores MCP, o Amazon Quick transforma pedidos em linguagem natural em chat agents, flows, automações, aplicações e integrações que acessam dados corporativos e executam tarefas.',
    'A palestra é prática, com demonstração ao vivo e os ativos criados na tela. Temas: a diferença entre um chatbot genérico e uma IA conectada ao contexto da empresa; como conectores e MCP aproximam a IA dos dados; criar um agente a partir de uma descrição em português; quando usar chat agent, flow, automação ou aplicação; como transformar uma conversa em solução reutilizável pela equipe; e os cuidados ao conectar IA, dados e processos corporativos.',
    'Para profissionais de dados, desenvolvedores e cloud, gestores de tecnologia e inovação, estudantes e empresas que querem levar os experimentos de IA para processos integrados.',
    'Como todo encontro do GU, o formato é conteúdo + troca de experiências + networking com a comunidade de dados de Curitiba. Depois do encontro, jantar por adesão (local informado no dia).',
  ],
  agenda: [
    { hora: '18h30', item: 'Credenciamento e networking' },
    { hora: '19h00', item: 'Abertura — GU BigData & IA, AWS User Group Curitiba e apoiadores' },
    {
      hora: '19h15',
      item: 'Palestra: Sua IA corporativa parou no chat? Agentes, automações e apps com o Amazon Quick — Iago Pimentel (demonstração ao vivo)',
    },
    { hora: '20h30', item: 'Perguntas e discussão (painel)' },
    { hora: '21h00', item: 'Encerramento, networking e fotos' },
    { hora: '21h20', item: 'Jantar por adesão (local informado no encontro)' },
  ],
  palestrantes: [
    {
      nome: 'Iago Pimentel',
      foto: '/gubigdata/iago-pimentel.jpg',
      tema: 'Atua com tecnologia, dados, cloud e IA no ambiente corporativo. Mostra na prática como conectar agentes de IA às informações e aos processos da empresa.',
    },
  ],
  realizacao:
    'Realização: GU Big Data & IA e AWS User Group Curitiba · Local: IEP — Instituto de Engenharia do Paraná.',
  associacoes: ['Associado IEP', 'Membro GU BigData & IA', 'Membro AWS User Group Curitiba', 'Participante DSSBR'],
  // Ingresso de R$30 de evento de comunidade: mostra PF/PJ, mas não trava a inscrição
  // por endereço. Espelha PRODUTOS[EVENTO_GU_SLUG] — o form não pode discordar do servidor.
  enderecoObrigatorioPJ: false,
} as const satisfies EventoPresencial
