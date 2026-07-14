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
  },
  // Lista de espera do curso preparatório (Python/SQL/Docker) — pré-requisito do
  // Lakehouse. Reserva de interesse: NUNCA gera cobrança, só captura o lead pelo
  // tipo gratuito 'reserva'. asaasDescricao só existe pra satisfazer o registry.
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
    telefoneObrigatorio: false,
  },
}

export function getProduto(slug: string): ProdutoConfig {
  const p = PRODUTOS[slug]
  if (!p) throw new Error(`Produto desconhecido: ${slug}`)
  return p
}
