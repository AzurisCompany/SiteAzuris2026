import { describe, it, expect } from 'vitest'
import { CHECKOUT_URL, PRODUTO_TAB, PRODUTO_LABEL, PRODUTOS_ENCERRADOS, labelProduto } from '@/lib/admin-queries'
import { PRODUTOS } from '@/lib/produtos'
import { ETT_ASSINATURA_SLUG } from '@/lib/ett'

describe('catálogo do painel', () => {
  it('todo produto do registry tem checkout mapeado — senão some da Visão geral até a 1ª venda', () => {
    for (const slug of Object.keys(PRODUTOS)) {
      if (PRODUTOS_ENCERRADOS.has(slug)) continue
      expect(CHECKOUT_URL[slug], `${slug} sem CHECKOUT_URL`).toBeTruthy()
    }
  })

  // Evento que já aconteceu sai do CHECKOUT_URL, mas as vendas dele continuam na
  // lista: sem rótulo, a aba do encontro passado viraria slug cru na tela.
  it('produto encerrado perde o link de compra, nunca o nome', () => {
    for (const slug of PRODUTOS_ENCERRADOS) {
      expect(CHECKOUT_URL[slug], `${slug} encerrado mas ainda oferece checkout`).toBeUndefined()
      expect(PRODUTO_LABEL[slug], `${slug} sem PRODUTO_LABEL`).toBeTruthy()
      expect(PRODUTO_TAB[slug], `${slug} sem PRODUTO_TAB`).toBeTruthy()
    }
  })

  it('a assinatura do ETT também entra, mesmo não estando no registry de preço', () => {
    expect(CHECKOUT_URL[ETT_ASSINATURA_SLUG]).toBe('/ett/assinatura')
  })

  // São DOIS mapas de rótulo (PRODUTO_LABEL no card/título, PRODUTO_TAB na aba) e
  // é fácil preencher só um: foi o que fez o ETT aparecer como "ett-adesao" cru.
  it('todo slug mapeado tem rótulo NOS DOIS mapas — card com slug cru é bug', () => {
    for (const slug of Object.keys(CHECKOUT_URL)) {
      expect(PRODUTO_TAB[slug], `${slug} sem PRODUTO_TAB`).toBeTruthy()
      expect(PRODUTO_LABEL[slug], `${slug} sem PRODUTO_LABEL`).toBeTruthy()
      expect(labelProduto(slug), `${slug} caindo no fallback`).not.toBe(slug)
    }
  })

  it('as URLs são paths internos, não links soltos', () => {
    for (const [slug, url] of Object.entries(CHECKOUT_URL)) {
      expect(url.startsWith('/'), `${slug}: ${url}`).toBe(true)
    }
  })
})
