import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { GTM_ID } from '@/lib/gtm'

// Regra: toda página do site carrega o container GTM-T7647L5K. As 41 rotas do App
// Router herdam do root layout — de graça, inclusive as que ainda não existem. Os
// HTMLs estáticos do public/ não herdam nada: cada um precisa do snippet colado à
// mão, e é aí que uma página nova entra no ar sem medição sem ninguém perceber.
// Este teste é o alarme.

const RAIZ = join(__dirname, '..', '..', '..')
const PUBLIC = join(RAIZ, 'public')

// Não é página: template usado só pra renderizar a imagem de OG no headless. Medir
// screenshot de build sujaria a audiência.
const NAO_SAO_PAGINAS = ['assets/og-image-preview.html']

function htmlsDoPublic(dir = PUBLIC): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const caminho = join(dir, e.name)
    if (e.isDirectory()) return htmlsDoPublic(caminho)
    return e.name.endsWith('.html') ? [caminho] : []
  })
}

describe('Google Tag Manager em todas as páginas', () => {
  it('o root layout carrega o container e o fallback noscript', () => {
    const layout = readFileSync(join(RAIZ, 'src/app/layout.tsx'), 'utf8')
    expect(layout).toMatch(/googletagmanager\.com\/gtm\.js/)
    expect(layout, 'sumiu o <noscript> do GTM do layout').toMatch(
      /googletagmanager\.com\/ns\.html/,
    )
    expect(layout, 'o layout precisa montar o snippet a partir de GTM_ID').toMatch(/GTM_ID/)
  })

  const paginas = htmlsDoPublic().filter(
    (p) => !NAO_SAO_PAGINAS.some((ex) => relative(PUBLIC, p).replace(/\\/g, '/').endsWith(ex)),
  )

  it('achou as páginas estáticas do public/ pra checar', () => {
    // Se um refactor mover/apagar tudo, os it.each abaixo passariam vazios em silêncio.
    expect(paginas.length).toBeGreaterThan(0)
  })

  it.each(paginas.map((p) => [relative(RAIZ, p), p]))(
    '%s carrega o GTM no <head> e o noscript no <body>',
    (_nome, caminho) => {
      const html = readFileSync(caminho, 'utf8')
      const head = html.slice(0, html.search(/<body[\s>]/i))

      expect(head, 'snippet do GTM precisa estar no <head>').toContain(
        `'dataLayer','${GTM_ID}'`,
      )
      expect(html).toContain(`ns.html?id=${GTM_ID}`)
    },
  )
})
