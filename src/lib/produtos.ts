// Registry de produtos com checkout próprio (Asaas).
// Fonte da verdade do PREÇO — sempre lido no servidor, nunca confiar no client.
// Lakehouse continua com sua própria lógica de lote em [[db]] (determinarLoteAtivo);
// produtos de preço fixo (sem lote) ficam aqui.

export interface ProdutoConfig {
  /** curso_slug gravado na tabela inscricoes */
  slug: string
  nome: string
  descricao: string
  /** preço cheio de referência, em centavos (base dos cálculos) */
  precoCentavos: number
  /** desconto PIX sobre o preço cheio (0 = sem desconto). Ex.: 0.10 = 10% off */
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
}

export const PRODUTOS: Record<string, ProdutoConfig> = {
  'dss-2026': {
    slug: 'dss-2026',
    nome: 'Data Science Summit Brasil 2026',
    descricao: 'Pré-venda · 27 a 29 de outubro · IEP, Curitiba',
    precoCentavos: 47000, // R$ 470,00 (preço cheio de referência)
    pixDescontoPct: 0.1, // PIX: -10% → R$ 423,00
    cartaoAcrescimoPct: 0.1, // Cartão: +10% → R$ 517,00 (1x); juros nas 2x–3x
    maxParcelas: 3, // 1x à vista · 2x–3x com juros
    asaasDescricao: 'Ingresso DSS 2026 — Data Science Summit Brasil (pré-venda)',
    voltarUrl: 'https://dssbr.com.br/blog/pre-venda-2026/',
    voltarLabel: '← voltar pro DSS 2026',
  },
}

export function getProduto(slug: string): ProdutoConfig {
  const p = PRODUTOS[slug]
  if (!p) throw new Error(`Produto desconhecido: ${slug}`)
  return p
}
