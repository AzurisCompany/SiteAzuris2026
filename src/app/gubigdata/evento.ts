// O encontro CORRENTE do GU BigData & IA — página, checkout e rota de API leem daqui.
//
// Todo encontro tem slug próprio (`gubigdata-AAAA-MM`, registrado em [[produtos]]):
// é o que mantém receita, lotação e aba do painel separadas de um encontro pro outro.
// Trocar de encontro = editar este arquivo + criar a entrada no registry + cadastrar
// os dois tipos de ingresso (`geral` pago, `associado` grátis) em /admin/ingressos.
// O encontro anterior sai do ar junto: /gubigdata é sempre o próximo, nunca um arquivo.

export const EVENTO_GU_SLUG = 'gubigdata-2026-08'

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
  titulo: 'Encontro Presencial GU Big Data & IA – 26 de agosto: DSSBR ao Vivo e Process Mining na Saúde',
  chamada: 'Duas apresentações conectando tecnologia, dados, IA e aplicação real.',
  /** O encontro foi remarcado: a peça de divulgação leva selo "nova data". */
  novaData: true,
  /** "26 de agosto" — como o dia aparece no meio de um título. */
  dataTitulo: '26 de agosto',
  dataLonga: '26 de agosto de 2026, quarta',
  dataCurta: '26/08',
  inicio: '18h30',
  horario: '18h30 às 21h20',
  local: {
    sigla: 'IEP',
    nome: 'IEP — Instituto de Engenharia do Paraná',
    detalhe: 'Auditório do 2º andar',
    endereco: 'Rua Emiliano Perneta, 174 · Centro, Curitiba/PR',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=IEP+Instituto+de+Engenharia+do+Paran%C3%A1+Rua+Emiliano+Perneta+174+Curitiba',
  },
  banner: {
    src: '/gubigdata/banner-agosto.jpg',
    largura: 1672,
    altura: 941,
    alt: 'Encontro Presencial GU Big Data & IA — 26 de agosto: DSSBR ao Vivo e Process Mining na Saúde',
  },
  /** Parágrafos da seção "Descrição do evento" — texto puro (ver gotcha do SSR com <strong>). */
  descricao: [
    'O encontro de 26 de agosto junta duas apresentações que ligam infraestrutura tecnológica e aplicação real de dados: a demonstração ao vivo do sistema que vai transmitir e gravar o DSSBR, e o Process Mining aplicado à saúde.',
    'Na demonstração, Alessandro Binhara coloca em funcionamento a versão customizada da plataforma que apoia o Data Science Summit Brasil: áudio e vídeo em tempo real, salas pelo navegador, gravação, transcrição e integração com a infraestrutura digital do congresso. É a chance de testar a solução em situação real e dar feedback antes do palco.',
    'Na palestra, Marcelo Dallagassa mostra como o Process Mining reconstrói, a partir dos dados, o caminho real do paciente dentro de uma instituição de saúde — onde estão as esperas, o retrabalho e as etapas que fogem do processo esperado — e como isso vira decisão sobre qualidade, segurança e uso de recursos.',
    'Como todo encontro do GU, o formato é conteúdo + troca de experiências + networking com líderes, especialistas e a comunidade de dados de Curitiba.',
  ],
  agenda: [
    { hora: '18h30', item: 'Credenciamento e networking' },
    { hora: '19h00', item: 'Abertura — GU Big Data & IA' },
    {
      hora: '19h15',
      item: 'Demonstração: DSSBR ao Vivo — sistema de transmissão e gravação do congresso — Alessandro Binhara',
    },
    {
      hora: '19h50',
      item: 'Palestra: Revolucionando a saúde com mineração de processos — como os dados podem salvar vidas e otimizar recursos — Marcelo Dallagassa',
    },
    { hora: '20h45', item: 'Perguntas, debate e networking' },
    { hora: '21h00', item: 'Encerramento' },
    { hora: '21h20', item: 'Jantar por adesão (local informado no dia)' },
  ] satisfies ItemAgenda[],
  palestrantes: [
    {
      nome: 'Alessandro Binhara',
      foto: '/gubigdata/binhara-gu.jpg',
      tema: 'DSSBR ao Vivo: demonstração do sistema de transmissão e gravação do congresso. Fundador e curador do DSSBR e do GU Big Data & IA.',
    },
    {
      nome: 'Marcelo Dallagassa',
      foto: '/gubigdata/dallagassa.jpg',
      tema: 'Revolucionando a saúde com mineração de processos: como os dados podem salvar vidas e otimizar recursos. Tese de doutorado, PUCPR.',
    },
  ] satisfies Palestrante[],
  realizacao: 'Realização: IEP e TECPAR · Organização: Rede Sol e SUCESU PR · Patrocínio: Azuris.',
} as const
