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
    'Café da Manhã de Networking do DSSBR – 6 de outubro: computadores virtuais de alta performance para Arquitetura e Engenharia, com a Arlequim',
  chamada: 'Café da manhã, um case de Desktop as a Service e networking antes do expediente.',
  /** Tema curto — compartilhamento e cards. */
  tema: 'Computadores virtuais de alta performance para Arquitetura e Engenharia',
  novaData: false,
  dataTitulo: '6 de outubro',
  dataLonga: '6 de outubro de 2026, terça',
  dataCurta: '06/10',
  inicio: '8h',
  horario: '8h às 10h30',
  metaDescricao:
    'Dia 06/10 das 8h às 10h30 no IEP, Curitiba: café da manhã de networking do DSSBR com a Arlequim apresentando Desktop as a Service e um case de Arquitetura e Engenharia. Ingresso Geral R$ 30 · gratuito para convidados e associados IEP.',
  checkoutDescricao:
    'Café da manhã de networking do DSSBR em 06/10 no IEP, Curitiba. Ingresso Geral R$ 30 (PIX ou cartão em até 3x) ou gratuito para convidados e associados.',
  local: {
    sigla: 'IEP',
    nome: 'IEP — Instituto de Engenharia do Paraná',
    detalhe: 'Rua Emiliano Perneta, 174 · Centro',
    endereco: 'Rua Emiliano Perneta, 174 · Centro, Curitiba/PR',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=IEP+Instituto+de+Engenharia+do+Paran%C3%A1+Rua+Emiliano+Perneta+174+Curitiba',
  },
  banner: {
    src: '/cafe-networking/banner-outubro.jpg',
    largura: 1920,
    altura: 1080,
    alt: 'Café da Manhã de Networking do DSSBR — 6 de outubro, com a Arlequim: computadores virtuais de alta performance',
  },
  /** Parágrafos da "Descrição do evento" — texto puro (ver gotcha do SSR com <strong>). */
  descricao: [
    'No dia 6 de outubro, o DSSBR e o Instituto de Engenharia do Paraná realizam uma nova edição do Café da Manhã de Networking, em Curitiba. O encontro terá a participação da Arlequim, empresa brasileira especializada em computadores virtuais de alta performance, que apresentará sua tecnologia e um case voltado aos setores de Arquitetura e Engenharia.',
    'Projetos em BIM, CAD, modelagem 3D, simulação e renderização exigem máquinas cada vez mais potentes — o que gera custo alto de aquisição, atualização e manutenção de workstations. Na palestra "Seu Projeto Precisa de Mais Potência, Não de Outro Computador", a Arlequim mostra como o Desktop as a Service (DaaS) permite acessar computadores de alto desempenho pela nuvem, usando os notebooks e equipamentos que a empresa já tem.',
    'O processamento acontece em servidores remotos, o que permite trabalhar com projetos complexos sem depender da capacidade do computador local, e aumentar ou reduzir recursos conforme a demanda de cada projeto.',
    'O case aplicado cobre projetos BIM e CAD 3D, renderização e modelagem, simulações de engenharia, acesso remoto aos projetos, padronização dos ambientes de trabalho, redução da dependência de workstations físicas e escalabilidade conforme a demanda. É a oportunidade de entender quando contratar capacidade computacional sai melhor do que comprar equipamento novo.',
    'Entre um café e outro, o encontro é para ampliar a rede de contatos com profissionais de Arquitetura, Engenharia, Dados, Tecnologia e Inovação. Vagas limitadas.',
  ],
  agenda: [
    { hora: '08h00', item: 'Café da manhã e networking' },
    { hora: '08h30', item: 'Abertura' },
    {
      hora: '08h40',
      item: 'Apresentação da Arlequim: Seu Projeto Precisa de Mais Potência, Não de Outro Computador',
    },
    { hora: '09h20', item: 'Case de Arquitetura e Engenharia' },
    { hora: '10h00', item: 'Perguntas e networking' },
    { hora: '10h30', item: 'Encerramento' },
  ],
  // A peça do DSSBR anuncia a EMPRESA, não pessoas: sem foto e sem nome de quem
  // sobe ao palco. A seção "Quem apresenta" some sozinha quando a lista é vazia.
  palestrantes: [],
  realizacao: 'Realização: DSSBR e IEP — Instituto de Engenharia do Paraná · Apresentação: Arlequim.',
  associacoes: ['Convidado da Arlequim', 'Associado IEP', 'Participante DSSBR', 'Membro GU BigData & IA'],
  // Café de R$30: mostra PF/PJ mas não trava por endereço, como o GU.
  // Espelha PRODUTOS[CAFE_SLUG] — o form não pode discordar do servidor.
  enderecoObrigatorioPJ: false,
} as const satisfies EventoPresencial
