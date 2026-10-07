import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { GRUPOS_LINKS } from '@/lib/links-venda'
import { PRODUTOS } from '@/lib/produtos'

// Canário do /admin/links: link copiado pra cliente não pode apontar pra rota que
// não existe, nem pra produto que saiu do registry.
const SRC = path.resolve(__dirname, '../..')
const links = GRUPOS_LINKS.flatMap((g) => g.links)

function rotaExiste(caminho: string) {
  const app = path.join(SRC, 'app', caminho, 'page.tsx')
  const estatico = path.join(SRC, '..', 'public', caminho, 'index.html')
  return existsSync(app) || existsSync(estatico)
}

describe('links de venda', () => {
  it.each(links.map((l) => [l.caminho]))('%s existe no app', (caminho) => {
    expect(rotaExiste(caminho)).toBe(true)
  })

  it('todo slug está no registry de produtos', () => {
    for (const l of links) if (l.slug) expect(PRODUTOS[l.slug], l.slug).toBeDefined()
  })

  it('sem caminho repetido', () => {
    const caminhos = links.map((l) => l.caminho)
    expect(new Set(caminhos).size).toBe(caminhos.length)
  })

  it('a camiseta de palestrante está na lista', () => {
    expect(links.some((l) => l.caminho === '/dssbr-2026/camiseta')).toBe(true)
  })
})
