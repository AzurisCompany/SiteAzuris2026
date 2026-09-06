// O encontro CORRENTE do GU BigData & IA — página, checkout e rota de API leem daqui.
//
// Todo encontro tem slug próprio (`gubigdata-AAAA-MM`, registrado em [[produtos]]):
// é o que mantém receita, lotação e aba do painel separadas de um encontro pro outro.
// Trocar de encontro = editar este arquivo + criar a entrada no registry + cadastrar
// os dois tipos de ingresso (`geral` pago, `associado` grátis) em /admin/ingressos.
// O encontro anterior sai do ar junto: /gubigdata é sempre o próximo, nunca um arquivo.

export const EVENTO_GU_SLUG = 'gubigdata-2026-09'

export interface ItemAgenda {
  hora: string
  item: string
}

export interface Palestrante {
  nome: string
  foto: string
  tema: string
}

export const EVENTO_GU = {
  slug: EVENTO_GU_SLUG,
  titulo:
    'Encontro Presencial GU Big Data & IA – 24 de setembro: Churn Antes que Aconteça, o case Onetopia + Tecnofit',
  chamada: 'Um case real de Advanced Analytics e IA em produção, contado por quem construiu.',
  /** Tema curto do encontro — usado no card da /comunidade e no compartilhamento. */
  tema: 'Churn Antes que Aconteça — o case Onetopia + Tecnofit',
  /** O encontro foi remarcado: a peça de divulgação leva selo "nova data". */
  novaData: false,
  /** "24 de setembro" — como o dia aparece no meio de um título. */
  dataTitulo: '24 de setembro',
  dataLonga: '24 de setembro de 2026, quinta',
  dataCurta: '24/09',
  inicio: '18h30',
  horario: '18h30 às 21h00',
  /** Descrição da página do evento (indexável) — não repetir data em texto solto. */
  metaDescricao:
    'Dia 24/09 às 18h30 no IEP, Curitiba: a Onetopia apresenta o case de previsão de churn e LTV construído para a Tecnofit, com Marcio Viana e Leandro Krukoski. Ingresso Geral R$ 30 · gratuito para associados IEP, GU BigData e participantes DSSBR.',
  /** Descrição do checkout (noindex) — só o essencial pra quem já decidiu. */
  checkoutDescricao:
    'Encontro presencial do GU BigData & IA em 24/09 no IEP, Curitiba. Ingresso Geral R$ 30 (PIX ou cartão em até 3x) ou gratuito para associados.',
  local: {
    sigla: 'IEP',
    nome: 'IEP — Instituto de Engenharia do Paraná',
    detalhe: 'Auditório do 2º andar',
    endereco: 'Rua Emiliano Perneta, 174 · Centro, Curitiba/PR',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=IEP+Instituto+de+Engenharia+do+Paran%C3%A1+Rua+Emiliano+Perneta+174+Curitiba',
  },
  banner: {
    src: '/gubigdata/banner-setembro.jpg',
    largura: 1672,
    altura: 941,
    alt: 'Encontro Presencial GU Big Data & IA — 24 de setembro: Churn Antes que Aconteça, o case Onetopia + Tecnofit',
  },
  /** Parágrafos da seção "Descrição do evento" — texto puro (ver gotcha do SSR com <strong>). */
  descricao: [
    'No encontro de 24 de setembro, a Onetopia apresenta um case real desenvolvido para a Tecnofit, uma das principais plataformas de gestão para academias e negócios fitness.',
    'A palestra mostra como Advanced Analytics e Inteligência Artificial foram aplicados para antecipar o risco de cancelamento de alunos, calcular o valor dos clientes ao longo do tempo (LTV) e transformar dados de frequência e pagamento em ações práticas para os gestores das academias.',
    'Cada alerta é transparente: além de classificar o aluno por nível de risco, a solução apresenta os principais motivos que geraram o alerta e recomenda a abordagem de retenção — o gestor entende o porquê, não só o número. O resultado foi entregue como um dashboard one-page integrado nativamente ao sistema da Tecnofit, via Embedded Analytics, e inclui o módulo Discover, que compara os indicadores da academia com os do mercado da própria região.',
    'O projeto entrou em produção durante o Fitness Brasil, respondendo ao vivo a consultas de diferentes unidades da base da Tecnofit — e ganhou dois novos segmentos de clientes enquanto o evento ainda acontecia. Na palestra, a Onetopia abre os bastidores: decisões técnicas e de negócio, desafios da implantação e o que se aprende ao transformar um MVP analítico em parte de um produto usado pelo mercado.',
    'Como todo encontro do GU, o formato é conteúdo + troca de experiências + networking com líderes, especialistas e a comunidade de dados de Curitiba.',
  ],
  agenda: [
    { hora: '18h30', item: 'Credenciamento e networking' },
    { hora: '19h00', item: 'Abertura — GU Big Data & IA' },
    {
      hora: '19h15',
      item: 'Palestra: Churn Antes que Aconteça — como dados e IA transformam retenção e LTV na Tecnofit — Marcio Viana e Leandro Krukoski (Onetopia)',
    },
    { hora: '20h15', item: 'Perguntas e troca de experiências (painel)' },
    { hora: '21h00', item: 'Encerramento e networking' },
  ] satisfies ItemAgenda[],
  palestrantes: [
    {
      nome: 'Marcio Viana',
      foto: '/gubigdata/marcio-viana.jpg',
      tema: 'A visão de negócio por trás do projeto: como dados, tecnologia e IA apoiam decisões estratégicas. C-Level, CEO e conselheiro de administração na Onetopia.',
    },
    {
      nome: 'Leandro Krukoski',
      foto: '/gubigdata/leandro-krukoski.jpg',
      tema: 'Os desafios técnicos: construção da solução analítica, integração ao ambiente da Tecnofit e a entrada em produção. Líder de Dados, Tecnologia e Transformação Digital na Onetopia.',
    },
  ] satisfies Palestrante[],
  realizacao:
    'Realização: IEP — Instituto de Engenharia do Paraná · Organização: GU Big Data & IA, Rede Sol e SUCESU PR.',
} as const
