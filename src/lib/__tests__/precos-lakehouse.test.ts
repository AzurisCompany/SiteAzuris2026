import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PRECO_POR_PERFIL } from '@/lib/db'
import { PRODUTOS } from '@/lib/produtos'

// O curso Lakehouse tem o preço em DOIS mundos: `PRECO_POR_PERFIL` (o que o checkout
// cobra) e o HTML estático de public/lakehouse-comunidade/ (o que a landing promete).
// O HTML não é lido por ninguém em runtime — ninguém percebe quando ele envelhece.
//
// Em 25/08/2026 caíram duas coisas ao mesmo tempo: o preço de comunidade (R$550, que
// virou R$750 pra todo mundo) e o bônus do ingresso do DSSBR incluso no curso. Um
// resíduo de qualquer um dos dois na página é promessa que a gente não cumpre mais —
// e, no caso do bônus, um ingresso de R$670 dado de graça por engano.
const PAGINAS = ['index.html', 'ementa.html'].map((f) =>
  readFileSync(join(__dirname, '..', '..', '..', 'public', 'lakehouse-comunidade', f), 'utf8'),
)

describe('preço do curso Lakehouse', () => {
  it('é único: membro e não-membro pagam o mesmo', () => {
    expect(PRECO_POR_PERFIL.membro.preco_centavos).toBe(PRECO_POR_PERFIL['nao-membro'].preco_centavos)
  })

  it('a landing anuncia o preço que o checkout cobra', () => {
    const reais = PRECO_POR_PERFIL['nao-membro'].preco_centavos / 100
    // O card de preço quebra o número em <span class="moeda">R$</span>750 — daí o
    // match no número solto entre tags, e não em "R$ 750".
    expect(PAGINAS[0], 'o preço do card da landing não é o que o checkout cobra').toMatch(
      new RegExp(`>\\s*${reais}\\s*<`),
    )
  })

  it('nenhuma página ainda oferece o preço de comunidade de R$ 550', () => {
    for (const html of PAGINAS) {
      expect(html, 'sobrou R$ 550 na página do curso').not.toMatch(/R\$\s*550|>550</)
    }
  })

  it('nenhuma página ainda promete o ingresso do DSSBR como bônus', () => {
    for (const html of PAGINAS) {
      expect(html, 'a promoção do ingresso incluso encerrou em 25/08/2026').not.toMatch(
        /(bônus|bonus)[^<]{0,40}dssbr|ingresso\s+(completo\s+)?(pro\s+|do\s+)?dssbr/i,
      )
    }
  })
})

// O caminho de quem quer curso + congresso agora é o combo, não o brinde.
describe('combo FullPass + curso', () => {
  // Desde 27/09/2026 (FullPass no Lote 3, R$887) o combo sai R$850 — ABAIXO do
  // ingresso sozinho, por decisão do Binhara. Se o combo voltar a ficar acima, a nota
  // da página /dssbr-2026/fullpass-curso ("fica R$ 850") precisa ser reescrita.
  it('sai por R$ 850, abaixo do FullPass sozinho', () => {
    const combo = PRODUTOS['dss-fullpass-curso-2026'].precoCentavos
    const fullpass = PRODUTOS['dss-2026'].precoCentavos
    expect(combo).toBeLessThan(fullpass)
    expect(combo).toBe(85000)
  })
})
