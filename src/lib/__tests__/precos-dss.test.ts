import { describe, it, expect } from 'vitest'
import { PRODUTOS } from '@/lib/produtos'
import { precosSugeridosCobranca } from '@/lib/admin-queries'

// O FullPass do DSS tem DOIS lugares dizendo o preço: o tipo de ingresso ativo em
// /admin/ingressos (o que vende) e o registry (fallback de quando o banco não
// responde, prefill da cobrança avulsa e descrição que vai pro Asaas/nota). Eles já
// se desencontraram uma vez — o registry ficou em R$470 de pré-venda por 3 semanas
// enquanto o checkout cobrava R$570.
const LOTE_VIGENTE_CENTAVOS = 57000 // Lote 1 · R$ 570,00 — espelha o tipo ativo no admin

describe('preço do FullPass do DSS', () => {
  it('o fallback do registry é o preço do lote que está vendendo', () => {
    expect(
      PRODUTOS['dss-2026'].precoCentavos,
      'virou o lote no /admin/ingressos? atualize o registry (e esta constante) junto',
    ).toBe(LOTE_VIGENTE_CENTAVOS)
  })

  it('a cobrança avulsa sugere o mesmo número que o checkout cobra', () => {
    expect(precosSugeridosCobranca()['dss-2026'].centavos).toBe(LOTE_VIGENTE_CENTAVOS)
  })

  it('a âncora riscada é maior que o preço praticado', () => {
    const p = PRODUTOS['dss-2026']
    expect(p.precoDeVendaCentavos).toBeGreaterThan(p.precoCentavos)
  })
})

// A pré-venda encerrou em 17/07/2026. Rótulo de campanha vencida no texto do produto
// vaza pro checkout, pra descrição da cobrança e daí pra nota fiscal.
describe('rótulos de campanha no registry', () => {
  it('nenhum produto se anuncia como pré-venda', () => {
    for (const [slug, p] of Object.entries(PRODUTOS)) {
      expect(`${p.descricao} ${p.asaasDescricao}`, `${slug} ainda diz pré-venda`).not.toMatch(
        /pré-?venda/i,
      )
    }
  })
})
