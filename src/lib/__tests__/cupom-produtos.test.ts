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
    expect(normalizarProdutos(['dss-business-2026', 'dss-vip-2026', 'dss-business-2026', 'inventado'])).toEqual([
      'dss-vip-2026',
      'dss-business-2026',
    ])
    // FullPass encerrado em 08/10/2026: cupom antigo que ainda o cite perde o produto
    expect(normalizarProdutos(['dss-2026', 'dss-vip-2026'])).toEqual(['dss-vip-2026'])
    expect(normalizarProdutos('dss-vip-2026')).toEqual([])
    expect(normalizarProdutos(undefined)).toEqual([])
  })
})
