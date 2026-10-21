import { describe, it, expect } from 'vitest'
import { PRODUTOS_COM_CUPOM, normalizarProdutos } from '@/lib/cupom-produtos'
import { PRODUTOS } from '@/lib/produtos'

describe('produtos que aceitam cupom', () => {
  it('todo produto da lista existe no registry e tem checkout em /dssbr-2026', () => {
    for (const p of PRODUTOS_COM_CUPOM) {
      expect(PRODUTOS[p.slug], p.slug).toBeTruthy()
      expect(p.caminho, p.slug).toMatch(/^\/dssbr-2026\//)
    }
  })

  it('normaliza o que vem do admin: só slugs conhecidos, sem repetir, na ordem da lista', () => {
    // VIP encerrado em 21/10/2026 (o último): nenhum ingresso aceita cupom, então cupom
    // antigo que cite FullPass (08/10), Business (16/10) ou VIP perde o produto
    expect(PRODUTOS_COM_CUPOM).toEqual([])
    expect(normalizarProdutos(['dss-vip-2026', 'dss-business-2026', 'dss-2026', 'inventado'])).toEqual([])
    expect(normalizarProdutos('dss-vip-2026')).toEqual([])
    expect(normalizarProdutos(undefined)).toEqual([])
  })
})
