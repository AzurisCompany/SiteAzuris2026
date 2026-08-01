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
}

export const PRODUTOS: Record<string, ProdutoConfig> = {
  'dss-2026': {
    slug: 'dss-2026',
    nome: 'Data Science Summit Brasil 2026',
    descricao: 'Pré-venda · 27 a 29 de outubro · IEP, Curitiba',
    precoCentavos: 47000, // R$ 470,00 — preço da pré-venda (o que se paga, PIX ou cartão 1x)
    precoDeVendaCentavos: 82000, // R$ 820,00 — preço cheio de venda (âncora riscada)
    pixDescontoPct: 0, // pré-venda já é o desconto; sem off adicional no PIX
    cartaoAcrescimoPct: 0, // cartão = preço de pré-venda; só juros no parcelamento (2x–3x)
    maxParcelas: 3, // 1x à vista · 2x–3x com juros
    asaasDescricao: 'Ingresso DSS 2026 — Data Science Summit Brasil (pré-venda)',
    voltarUrl: 'https://dssbr.com.br/blog/pre-venda-2026/',
    voltarLabel: '← voltar pro DSS 2026',
    telefoneObrigatorio: true,
    enderecoObrigatorioPJ: true, // ingresso corporativo quase sempre vira nota
  },
  // Passe de 1 dia do DSS 2026 (o full são 3 dias — ver 'dss-2026'). Lote é gerido
  // AQUI, no preço: hoje vende Lote 1 (R$247) com âncora do Lote 3 (R$357) riscada.
  // Quando o lote virar, sobe precoCentavos (Lote 2 = 29700, Lote 3 = 35700). Sem
  // tipos cadastrados → o checkout usa o preço único deste registry.
  'dss-one-day-2026': {
    slug: 'dss-one-day-2026',
    nome: 'DSS 2026 — Passe One Day',
    descricao: 'Passe de 1 dia · 27 a 29 de outubro · IEP, Curitiba',
    precoCentavos: 24700, // R$ 247,00 — Lote 1 (o que se paga agora, PIX ou cartão 1x)
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
  // Combo (cross-sell): One Day + acesso ao portal do curso "Lakehouse: Pipeline na
  // Prática" ([[project_curso_lakehouse_pages]]). Preço fixo R$360 (sem lote, sem
  // âncora — o curso avulso é R$550+, mas o combo dá acesso ao PORTAL/conteúdo, não
  // ao pacote completo com ao-vivo+1:1; não riscamos preço pra não superprometer).
  // FULFILLMENT DO CURSO É MANUAL: a compra registra a inscrição; liberar o portal
  // é passo operacional do Binhara (não há automação ligando os dois).
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
  // Evento do grupo de usuários GU BigData & IA (não é produto Azuris — a Azuris
  // só processa a inscrição). Os preços reais vêm dos tipos de ingresso cadastrados
  // no admin (geral R$30 / associado grátis); este registro é o fallback e a config.
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
  // Adesão do English Talk Time ([[project_ecosystem]]). Cobrada UMA VEZ — não vira
  // mensalidade. Dá 2 encontros individuais de 1h, material personalizado, entrada nos
  // encontros de conversação, conta no ETT Player/Speak e os 30 primeiros dias de
  // plataforma. A mensalidade (Trilha de Dedicação, R$39/mês) é OUTRO produto, recorrente,
  // que NÃO passa por aqui: assinatura tem checkout próprio em /api/ett/assinatura ([[ett]]).
  'ett-adesao': {
    slug: 'ett-adesao',
    nome: 'English Talk Time — Adesão',
    descricao: 'Pagamento único · 2h de mentoria individual + 30 dias de plataforma',
    precoCentavos: 7000, // R$ 70,00 — preço único da adesão (PIX ou cartão 1x)
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
