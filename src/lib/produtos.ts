// Registry de produtos com checkout próprio (Asaas).
// Fonte da verdade do PREÇO — sempre lido no servidor, nunca confiar no client.
// Lakehouse continua com sua própria lógica de lote em [[db]] (determinarLoteAtivo);
// produtos de preço fixo (sem lote) ficam aqui.

export interface ProdutoConfig {
  /** curso_slug gravado na tabela inscricoes */
  slug: string
  nome: string
  descricao: string
  /** preço efetivamente cobrado, em centavos (base dos cálculos — o que o cliente paga) */
  precoCentavos: number
  /** preço cheio de venda (lote final / no dia), em centavos — âncora "de" riscada. 0 = sem âncora */
  precoDeVendaCentavos: number
  /** desconto PIX sobre o preço base (0 = sem desconto). Ex.: 0.10 = 10% off */
  pixDescontoPct: number
  /** acréscimo no cartão sobre o preço cheio (0 = sem acréscimo). Ex.: 0.10 = +10% */
  cartaoAcrescimoPct: number
  /** parcelas máximas no cartão (1x à vista; 2x+ com juros embutidos) */
  maxParcelas: number
  /** descrição enviada ao Asaas na cobrança */
  asaasDescricao: string
  /** link "voltar" exibido nas telas de checkout/obrigado */
  voltarUrl: string
  /** rótulo do botão voltar */
  voltarLabel: string
  /** telefone exigido no cadastro. false = captura de lead com atrito mínimo (só nome + email) */
  telefoneObrigatorio: boolean
  /**
   * PJ (CNPJ) só fecha a compra com endereço completo — é o que permite emitir a
   * nota depois. false = mostra o seletor PF/PJ e aceita endereço, mas não obriga
   * (evento de comunidade barato, onde o atrito custa mais que a nota).
   */
  enderecoObrigatorioPJ: boolean
  /**
   * Só vende COM tipo de ingresso, e só o lote vigente por quantidade
   * ([[lotes-quantidade]]). Sem isto, um POST sem `tipo` cairia no `precoCentavos`
   * deste registry — o preço do Lote 1 — mesmo com o Lote 1 esgotado.
   */
  tipoObrigatorio?: boolean
}

export const PRODUTOS: Record<string, ProdutoConfig> = {
  'dss-2026': {
    slug: 'dss-2026',
    nome: 'Data Science Summit Brasil 2026',
    // Sem nome de lote aqui: quem diz o lote é o tipo de ingresso escolhido no
    // checkout. Rótulo fixo de lote nesta linha vira mentira na virada do lote.
    descricao: '27 a 29 de outubro · IEP, Curitiba',
    // O preço que VENDE vem do tipo de ingresso ativo em /admin/ingressos (Lote 2,
    // R$670 hoje). Este número é o FALLBACK de quando o banco não responde — e por
    // isso tem que acompanhar o lote vigente: fallback velho mostra um preço que
    // ninguém mais pratica. O Lote 1 (R$570) encerrou em 25/08/2026.
    precoCentavos: 67000, // R$ 670,00 — Lote 2 (o que se paga, PIX ou cartão 1x)
    precoDeVendaCentavos: 82000, // R$ 820,00 — preço cheio de venda (âncora riscada)
    pixDescontoPct: 0, // o preço do lote é o preço; sem off adicional no PIX
    cartaoAcrescimoPct: 0, // cartão = preço do lote; só juros no parcelamento (2x–3x)
    maxParcelas: 3, // 1x à vista · 2x–3x com juros
    asaasDescricao: 'Ingresso DSS 2026 — Data Science Summit Brasil (FullPass, 3 dias)',
    voltarUrl: 'https://dssbr.com.br/blog/pre-venda-2026/',
    voltarLabel: '← voltar pro DSS 2026',
    telefoneObrigatorio: true,
    enderecoObrigatorioPJ: true, // ingresso corporativo quase sempre vira nota
  },
  // Passe de 1 dia do DSS 2026 (o full são 3 dias — ver 'dss-2026'). Lote é gerido
  // AQUI, no preço: hoje vende Lote 2 (R$290) com âncora do Lote 3 (R$357) riscada.
  // Quando o lote virar, sobe precoCentavos (Lote 3 = 35700) e o `atual` da escada em
  // one-day/lotes.ts — o canário `precos-one-day.test.ts` reprova se desencontrarem.
  // Sem tipos cadastrados → o checkout usa o preço único deste registry.
  'dss-one-day-2026': {
    slug: 'dss-one-day-2026',
    nome: 'DSS 2026 — Passe One Day',
    descricao: 'Passe de 1 dia · 27 a 29 de outubro · IEP, Curitiba',
    precoCentavos: 29000, // R$ 290,00 — Lote 2 (o que se paga agora, PIX ou cartão 1x)
    precoDeVendaCentavos: 35700, // R$ 357,00 — Lote 3 / final (âncora "de" riscada)
    pixDescontoPct: 0, // sem off no PIX; o preço do lote é o preço
    cartaoAcrescimoPct: 0, // cartão = preço do lote; só juros no parcelamento (2x–3x)
    maxParcelas: 3, // 1x à vista · 2x–3x com juros
    asaasDescricao: 'Ingresso DSS 2026 — Passe One Day (1 dia de evento)',
    voltarUrl: '/dssbr-2026',
    voltarLabel: '← voltar pro DSS 2026',
    telefoneObrigatorio: true,
    enderecoObrigatorioPJ: true, // passe corporativo também vira nota
  },
  // ENCERRADO em 25/08/2026 — o combo com curso passou a existir só no FullPass
  // ('dss-fullpass-curso-2026'). Fica aqui, e em PRODUTOS_ENCERRADOS, porque o
  // histórico de vendas precisa saber o nome e o preço do que vendeu; o checkout
  // dele foi removido e /dssbr-2026/one-day-curso redireciona pro combo vigente.
  // Era: One Day + portal do curso "Lakehouse: Pipeline na Prática", R$360.
  'dss-one-day-curso-2026': {
    slug: 'dss-one-day-curso-2026',
    nome: 'DSS One Day + Portal do Curso Pipeline',
    descricao: 'Passe de 1 dia + portal do curso · 27 a 29 de outubro · IEP, Curitiba',
    precoCentavos: 36000, // R$ 360,00 — combo (o que se paga, PIX ou cartão 1x)
    precoDeVendaCentavos: 0, // sem âncora riscada (ver comentário acima)
    pixDescontoPct: 0,
    cartaoAcrescimoPct: 0,
    maxParcelas: 3, // 1x à vista · 2x–3x com juros
    asaasDescricao: 'Ingresso DSS 2026 — One Day + portal do curso Lakehouse: Pipeline na Prática',
    voltarUrl: '/dssbr-2026',
    voltarLabel: '← voltar pro DSS 2026',
    telefoneObrigatorio: true,
    enderecoObrigatorioPJ: true,
  },
  // Combo vigente (cross-sell): FullPass (3 dias) + acesso ao portal do curso
  // "Lakehouse: Pipeline na Prática" ([[project_curso_lakehouse_pages]]). R$750 fixo:
  // o FullPass sozinho é R$670, então o portal do curso sai por R$80.
  //
  // Sem âncora riscada de propósito. Somar 670 + 750 e riscar R$1.420 seria
  // superpromessa: o combo dá o PORTAL (conteúdo on-demand), não o pacote completo do
  // curso com encontros ao vivo e 1:1. Quem comunica o valor é a nota da página.
  //
  // FULFILLMENT DO CURSO É MANUAL: a compra registra a inscrição; liberar o portal
  // é passo operacional do Binhara (não há automação ligando os dois).
  'dss-fullpass-curso-2026': {
    slug: 'dss-fullpass-curso-2026',
    nome: 'DSS FullPass + Portal do Curso Pipeline',
    descricao: '3 dias de evento + portal do curso · 27 a 29 de outubro · IEP, Curitiba',
    precoCentavos: 75000, // R$ 750,00 — combo (o que se paga, PIX ou cartão 1x)
    precoDeVendaCentavos: 0, // sem âncora riscada (ver comentário acima)
    pixDescontoPct: 0,
    cartaoAcrescimoPct: 0,
    maxParcelas: 3, // 1x à vista · 2x–3x com juros
    asaasDescricao:
      'Ingresso DSS 2026 — FullPass (3 dias) + portal do curso Lakehouse: Pipeline na Prática',
    voltarUrl: '/dssbr-2026',
    voltarLabel: '← voltar pro DSS 2026',
    telefoneObrigatorio: true,
    enderecoObrigatorioPJ: true, // combo corporativo quase sempre vira nota
  },
  // VIP e Business do DSS 2026 — lotes que viram SOZINHOS por quantidade
  // ([[lotes-quantidade]]). Os três lotes de cada um são tipos de ingresso ativos ao
  // mesmo tempo, com `limite_qtd` (semeados pela migração); o checkout vende o primeiro
  // com vaga. O preço daqui NUNCA é cobrado (`tipoObrigatorio`) — é só o "a partir de"
  // de quando o banco não responde, e por isso é o do Lote 1.
  'dss-vip-2026': {
    slug: 'dss-vip-2026',
    nome: 'DSS 2026 — Ingresso VIP',
    descricao: 'VIP · 3 dias · 27 a 29 de outubro · IEP, Curitiba',
    precoCentavos: 95700, // R$ 957,00 — Lote 1 (10 ingressos); 1.275 (15) e 1.657 (15) depois
    precoDeVendaCentavos: 0, // a régua é a escada de lotes, não uma âncora riscada
    pixDescontoPct: 0,
    cartaoAcrescimoPct: 0,
    maxParcelas: 3, // 1x à vista · 2x–3x com juros (mesma regra do FullPass)
    asaasDescricao: 'Ingresso DSS 2026 — VIP (3 dias)',
    voltarUrl: '/dssbr-2026',
    voltarLabel: '← voltar pro DSS 2026',
    telefoneObrigatorio: true,
    enderecoObrigatorioPJ: true, // ingresso corporativo quase sempre vira nota
    tipoObrigatorio: true,
  },
  'dss-business-2026': {
    slug: 'dss-business-2026',
    nome: 'DSS 2026 — Ingresso Business',
    descricao: 'Business · 3 dias · 27 a 29 de outubro · IEP, Curitiba',
    precoCentavos: 75700, // R$ 757,00 — Lote 1 (10 ingressos); 984 (10) e 1.279 (10) depois
    precoDeVendaCentavos: 0,
    pixDescontoPct: 0,
    cartaoAcrescimoPct: 0,
    maxParcelas: 3,
    asaasDescricao: 'Ingresso DSS 2026 — Business (3 dias)',
    voltarUrl: '/dssbr-2026',
    voltarLabel: '← voltar pro DSS 2026',
    telefoneObrigatorio: true,
    enderecoObrigatorioPJ: true,
    tipoObrigatorio: true,
  },
  // Evento do grupo de usuários GU BigData & IA (não é produto Azuris — a Azuris
  // só processa a inscrição). Os preços reais vêm dos tipos de ingresso cadastrados
  // no admin (geral R$30 / associado grátis); este registro é o fallback e a config.
  //
  // Cada encontro é um SLUG PRÓPRIO (`gubigdata-AAAA-MM`): é o que separa a receita,
  // a lotação e a aba do painel entre um encontro e o seguinte. Quem manda no
  // encontro corrente é EVENTO_GU_SLUG em [[gubigdata/evento]] — as páginas e a
  // rota de API leem de lá, não daqui. Encontro passado fica neste registry só pra
  // o histórico continuar sabendo o nome do que foi vendido.
  'gubigdata-2026-09': {
    slug: 'gubigdata-2026-09',
    nome: 'Encontro Presencial GU BigData & IA — 24 de setembro',
    descricao: '24 de setembro · 18h30 · IEP, Curitiba',
    precoCentavos: 3000, // R$ 30,00 — ingresso Geral (fallback se não houver tipos)
    precoDeVendaCentavos: 0, // sem âncora — evento de comunidade, preço é o preço
    pixDescontoPct: 0,
    cartaoAcrescimoPct: 0,
    maxParcelas: 3, // 1x à vista · 2x–3x com juros
    asaasDescricao: 'Ingresso — Encontro GU BigData & IA 24/09 (IEP, Curitiba)',
    voltarUrl: '/gubigdata',
    voltarLabel: '← voltar pra página do evento',
    telefoneObrigatorio: true,
    // Ingresso de R$30 de evento de comunidade: mostra PF/PJ, mas não trava a
    // inscrição por endereço. Quem for PJ e quiser nota preenche por opção.
    enderecoObrigatorioPJ: false,
  },
  'gubigdata-2026-08': {
    slug: 'gubigdata-2026-08',
    nome: 'Encontro Presencial GU BigData & IA — 26 de agosto',
    descricao: '26 de agosto · 18h30 · IEP, Curitiba',
    precoCentavos: 3000, // R$ 30,00 — ingresso Geral (fallback se não houver tipos)
    precoDeVendaCentavos: 0, // sem âncora — evento de comunidade, preço é o preço
    pixDescontoPct: 0,
    cartaoAcrescimoPct: 0,
    maxParcelas: 3, // 1x à vista · 2x–3x com juros
    asaasDescricao: 'Ingresso — Encontro GU BigData & IA 26/08 (IEP, Curitiba)',
    voltarUrl: '/gubigdata',
    voltarLabel: '← voltar pra página do evento',
    telefoneObrigatorio: true,
    // Ingresso de R$30 de evento de comunidade: mostra PF/PJ, mas não trava a
    // inscrição por endereço. Quem for PJ e quiser nota preenche por opção.
    enderecoObrigatorioPJ: false,
  },
  'gubigdata-2026-07': {
    slug: 'gubigdata-2026-07',
    nome: 'Encontro Presencial GU BigData & IA — 30 de julho',
    descricao: '30 de julho · 18h30 · IEP, Curitiba',
    precoCentavos: 3000, // R$ 30,00 — ingresso Geral (fallback se não houver tipos)
    precoDeVendaCentavos: 0, // sem âncora — evento de comunidade, preço é o preço
    pixDescontoPct: 0,
    cartaoAcrescimoPct: 0,
    maxParcelas: 3, // 1x à vista · 2x–3x com juros
    asaasDescricao: 'Ingresso — Encontro GU BigData & IA 30/07 (IEP, Curitiba)',
    voltarUrl: '/gubigdata',
    voltarLabel: '← voltar pra página do evento',
    telefoneObrigatorio: true,
    // Ingresso de R$30 de evento de comunidade: mostra PF/PJ, mas não trava a
    // inscrição por endereço. Quem for PJ e quiser nota preenche por opção.
    enderecoObrigatorioPJ: false,
  },
  // Café da manhã de networking do DSSBR no IEP ([[cafe-networking/evento]]). Mesma
  // arquitetura dos encontros do GU: cada edição é um slug próprio
  // (`cafe-networking-AAAA-MM`), e `/cafe-networking` é sempre a corrente.
  'cafe-networking-2026-10': {
    slug: 'cafe-networking-2026-10',
    nome: 'Café da Manhã de Networking do DSSBR — 6 de outubro',
    descricao: '6 de outubro · 8h às 10h · IEP, Curitiba',
    precoCentavos: 3000, // R$ 30,00 — ingresso Geral (fallback se não houver tipos)
    precoDeVendaCentavos: 0, // sem âncora — evento de relacionamento, preço é o preço
    pixDescontoPct: 0,
    cartaoAcrescimoPct: 0,
    maxParcelas: 3, // 1x à vista · 2x–3x com juros
    asaasDescricao: 'Ingresso — Café de Networking DSSBR 06/10 (IEP, Curitiba)',
    voltarUrl: '/cafe-networking',
    voltarLabel: '← voltar pra página do evento',
    telefoneObrigatorio: true,
    // Café de R$30: mostra PF/PJ, mas não trava a inscrição por endereço (mesma
    // regra do GU — o atrito custa mais que a nota).
    enderecoObrigatorioPJ: false,
  },
  // Adesão do English Talk Time ([[project_ecosystem]]). Cobrada UMA VEZ — não vira
  // mensalidade. Dá 2 encontros individuais de 1h, material personalizado, entrada nos
  // encontros de conversação, conta no ETT Player/Speak e os 30 primeiros dias de
  // plataforma. A mensalidade (Trilha de Dedicação, R$39/mês) é OUTRO produto, recorrente,
  // que NÃO passa por aqui: assinatura tem checkout próprio em /api/ett/assinatura ([[ett]]).
  'ett-adesao': {
    slug: 'ett-adesao',
    nome: 'English Talk Time — Adesão',
    descricao: 'Pagamento único · 2h de mentoria individual + 30 dias de plataforma',
    precoCentavos: 6700, // R$ 67,00 — preço único da adesão (PIX ou cartão 1x)
    precoDeVendaCentavos: 0, // sem âncora riscada — o preço é o preço
    pixDescontoPct: 0,
    cartaoAcrescimoPct: 0,
    maxParcelas: 3, // 1x à vista · 2x–3x com juros
    asaasDescricao: 'ETT — Adesão (2 encontros individuais, material e 30 dias de plataforma)',
    voltarUrl: 'https://englishtalktime.com.br',
    voltarLabel: '← voltar pro English Talk Time',
    telefoneObrigatorio: true, // o ETT roda no WhatsApp; sem telefone não dá pra marcar os encontros
    enderecoObrigatorioPJ: false, // produto de pessoa física; PJ pede nota por exceção
  },
  // Lista de espera do curso preparatório (Python/SQL/Docker) — pré-requisito do
  // Lakehouse. Reserva de interesse: NUNCA gera cobrança, só captura o lead pelo
  // tipo gratuito 'reserva'. asaasDescricao só existe pra satisfazer o registry.
  // Telefone é exigido aqui não pra cobrar, mas pra conversar: a ementa do
  // preparatório é montada a partir do que esses leads já sabem.
  'preparatorio-dados': {
    slug: 'preparatorio-dados',
    nome: 'Curso Preparatório de Dados — reserva de interesse',
    descricao: 'Python, SQL e Docker · em construção, sem data definida',
    precoCentavos: 0,
    precoDeVendaCentavos: 0,
    pixDescontoPct: 0,
    cartaoAcrescimoPct: 0,
    maxParcelas: 1,
    asaasDescricao: 'Reserva — Curso Preparatório de Dados (sem cobrança)',
    voltarUrl: '/lakehouse-comunidade',
    voltarLabel: '← voltar pro curso Lakehouse',
    telefoneObrigatorio: true,
    enderecoObrigatorioPJ: false, // reserva não cobra nada — não há nota pra emitir
  },
}

export function getProduto(slug: string): ProdutoConfig {
  const p = PRODUTOS[slug]
  if (!p) throw new Error(`Produto desconhecido: ${slug}`)
  return p
}
