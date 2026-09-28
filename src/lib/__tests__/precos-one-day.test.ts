import { describe, it, expect } from 'vitest'
import { PRODUTOS } from '@/lib/produtos'
import { LOTES_ONE_DAY, LOTE_ONEDAY_ATUAL } from '@/app/dssbr-2026/one-day/lotes'
import { precosSugeridosCobranca } from '@/lib/admin-queries'

// O One Day não tem tipo de ingresso no admin: quem cobra é o registry. A escada de
// lotes é só exibição — e por isso é exatamente onde o número velho sobrevive. Já
// esteve duplicada em dois arquivos, sem teste. Aqui ela tem um dono e um canário.
const PRODUTO = PRODUTOS['dss-one-day-2026']

describe('preço do Passe One Day', () => {
  it('o lote anunciado como atual é o preço que o checkout cobra', () => {
    expect(
      LOTE_ONEDAY_ATUAL.valor * 100,
      'virou o lote? mova o `atual` em one-day/lotes.ts e suba o precoCentavos junto',
    ).toBe(PRODUTO.precoCentavos)
  })

  it('exatamente um lote está em cartaz', () => {
    expect(LOTES_ONE_DAY.filter((l) => l.atual)).toHaveLength(1)
  })

  it('a âncora riscada é o lote final acima do atual — e no último lote não há âncora', () => {
    const maiorDaEscada = Math.max(...LOTES_ONE_DAY.map((l) => l.valor))
    if (maiorDaEscada * 100 === PRODUTO.precoCentavos) {
      expect(PRODUTO.precoDeVendaCentavos).toBe(0)
    } else {
      expect(PRODUTO.precoDeVendaCentavos).toBe(maiorDaEscada * 100)
      expect(PRODUTO.precoDeVendaCentavos).toBeGreaterThan(PRODUTO.precoCentavos)
    }
  })

  it('a cobrança avulsa sugere o mesmo número que o checkout cobra', () => {
    expect(precosSugeridosCobranca()['dss-one-day-2026'].centavos).toBe(PRODUTO.precoCentavos)
  })
})
