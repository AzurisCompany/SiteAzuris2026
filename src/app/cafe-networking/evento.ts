// O café da manhã de networking CORRENTE do DSSBR — página, checkout e rota de API
// leem daqui.
//
// Mesma arquitetura dos encontros do GU ([[gubigdata/evento]]): cada edição é um
// produto próprio (`cafe-networking-AAAA-MM`, registrado em [[produtos]]), e é isso
// que mantém receita, lotação e aba do painel separadas de um mês pro outro.
// `/cafe-networking` é SEMPRE a próxima edição, nunca um arquivo de cafés passados —
// é a URL que vai no post do dssbr.com.br, e link divulgado não pode mudar de endereço.
//
// Trocar de edição: este arquivo + entrada no registry + rótulos em admin-queries
// (a edição que saiu vai pra PRODUTOS_ENCERRADOS) + case no e-mail + seed dos tipos
// na migração + assets em public/cafe-networking/ + **desligar os tipos da edição
// anterior** em /admin/ingressos. Canário: `lib/__tests__/cafe-networking.test.ts`.

import type { EventoPresencial, MarcaEvento } from '@/lib/eventos/tipos'

export const CAFE_SLUG = 'cafe-networking-2026-10'

/** Quem assina: o DSSBR (a Azuris só processa a inscrição, e aparece no rodapé). */
export const MARCA_CAFE: MarcaEvento = {
  nome: 'Data Science Summit Brasil',
  logo: '/cafe-networking/logo-dss-2026.svg',
  corHeader: '#04120F', // verde-quase-preto do site do DSSBR — o logo é claro
  site: 'https://dssbr.com.br',
  siteRotulo: 'site do DSSBR',
  etiqueta: 'Café de networking',
  sobre:
    'é o congresso brasileiro de ciência de dados e IA, em Curitiba. Entre uma edição e outra, o DSSBR mantém encontros de networking abertos ao ecossistema de dados, tecnologia e inovação.',
}

export const EVENTO_CAFE = {
  slug: CAFE_SLUG,
  baseUrl: '/cafe-networking',
  apiUrl: '/api/cafe-networking/inscricao',
  tituloCurto: 'Café da Manhã de Networking do DSSBR',
  titulo:
    'Último Café de Networking antes do DSSBR – 6 de outubro: telemedicina veterinária com IA, com Lucas Moraes (Bindflow)',
  chamada: 'Café da manhã, o AtendeVet da Bindflow e networking antes do expediente — o último café antes do DSSBR 2026.',
  /** Tema curto — compartilhamento e cards. */
  tema: 'AtendeVet: gestão e teleatendimento veterinário com IA em uma única jornada',
  novaData: false,
  dataTitulo: '6 de outubro',
  dataLonga: '6 de outubro de 2026, terça',
  dataCurta: '06/10',
  inicio: '8h',
  horario: '8h às 10h',
  metaDescricao:
    'Dia 06/10 das 8h às 10h no IEP, Curitiba: último café de networking antes do DSSBR 2026, com Lucas Moraes (Bindflow) apresentando o AtendeVet — telemedicina veterinária com IA. Ingresso Geral R$ 30 · gratuito para convidados e associados.',
  checkoutDescricao:
    'Último café de networking do DSSBR antes do congresso, em 06/10 no IEP, Curitiba. Ingresso Geral R$ 30 (PIX ou cartão em até 3x) ou gratuito para convidados e associados.',
  local: {
    sigla: 'IEP',
    nome: 'IEP — Instituto de Engenharia do Paraná',
    detalhe: 'Rua Emiliano Perneta, 174 · Centro',
    endereco: 'Rua Emiliano Perneta, 174 · Centro, Curitiba/PR',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=IEP+Instituto+de+Engenharia+do+Paran%C3%A1+Rua+Emiliano+Perneta+174+Curitiba',
  },
  banner: {
    src: '/cafe-networking/banner-bindflow-outubro.jpg',
    largura: 1600,
    altura: 900,
    alt: 'Café de Networking — último café antes do DSSBR, 6 de outubro, 8h às 10h, IEP: AtendeVet, com Lucas Moraes, Chief Innovation Officer da Bindflow',
  },
  /** Parágrafos da "Descrição do evento" — texto puro (ver gotcha do SSR com <strong>). */
  descricao: [
    'No dia 6 de outubro acontece o último Café de Networking antes do DSSBR 2026, no Instituto de Engenharia do Paraná, em Curitiba. A manhã reúne profissionais de tecnologia, dados, inteligência artificial, saúde animal, gestão pública e inovação para uma conversa sobre como a telemedicina veterinária pode ampliar o acesso aos serviços e, ao mesmo tempo, produzir registros confiáveis para apoiar a gestão.',
    'A telemedicina veterinária está regulamentada pelo Conselho Federal de Medicina Veterinária e pode ampliar o alcance dos serviços públicos de saúde animal — castração, vacinação, controle de zoonoses, triagem e atendimento clínico —, especialmente onde há poucos médicos-veterinários. Mas o atendimento a distância só gera valor para o gestor quando vira registro: prontuário, receita válida, histórico clínico e dados para acompanhar os animais e planejar as políticas públicas.',
    'Na palestra "AtendeVet: gestão e teleatendimento veterinário com IA em uma única jornada", Lucas Moraes, Chief Innovation Officer da Bindflow, apresenta uma plataforma já usada no mercado privado e em operação em 26 estados: prontuário eletrônico, teleconsulta integrada ao registro clínico, assinatura digital ICP-Brasil, receituário (inclusive de controlados), histórico de atendimentos, API de integração e recursos de IA aplicados à jornada de atendimento.',
    'Tomando como referência um credenciamento público real de 2025, a apresentação compara essa estrutura com as necessidades da gestão pública em três pontos: o que a plataforma já tem, o que ainda precisa ser desenvolvido e qual instrumento contratual separa um projeto-piloto de uma política pública estruturada.',
    'O encontro é para profissionais de tecnologia, dados e IA, médicos-veterinários e gestores de clínicas, gestores públicos, universidades, startups e participantes do DSSBR 2026 — que acontece nos dias 27, 28 e 29 de outubro, no mesmo IEP. Vagas limitadas pela capacidade do espaço.',
  ],
  agenda: [
    { hora: '08h00', item: 'Recepção, café da manhã e networking' },
    { hora: '08h30', item: 'Abertura do encontro' },
    {
      hora: '08h40',
      item: 'Palestra com Lucas Moraes, da Bindflow: AtendeVet — gestão e teleatendimento veterinário com IA em uma única jornada',
    },
    { hora: '09h30', item: 'Perguntas, conexões e networking aberto' },
    { hora: '10h00', item: 'Encerramento' },
  ],
  palestrantes: [
    {
      nome: 'Lucas Moraes',
      foto: '/cafe-networking/lucas-moraes.jpg',
      tema: 'Chief Innovation Officer da Bindflow, onde desenvolve soluções digitais de integração de processos, atendimento, gestão e IA. Apresenta o AtendeVet e os aprendizados de construir uma jornada digital completa para o atendimento veterinário.',
    },
  ],
  realizacao: 'Realização: DSSBR e IEP — Instituto de Engenharia do Paraná · Apresentação: Bindflow.',
  associacoes: ['Convidado da Bindflow', 'Associado IEP', 'Participante DSSBR', 'Membro GU BigData & IA'],
  // Café de R$30: mostra PF/PJ mas não trava por endereço, como o GU.
  // Espelha PRODUTOS[CAFE_SLUG] — o form não pode discordar do servidor.
  enderecoObrigatorioPJ: false,
} as const satisfies EventoPresencial
