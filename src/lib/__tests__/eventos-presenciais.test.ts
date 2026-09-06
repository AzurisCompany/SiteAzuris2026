import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PRODUTOS } from '@/lib/produtos'
import { PRODUTO_LABEL, PRODUTO_TAB, CHECKOUT_URL, precosSugeridosCobranca } from '@/lib/admin-queries'
import { getOpcaoCobranca } from '@/lib/cobranca-manual'
import { conteudoCompraConfirmada } from '@/lib/email/conteudo'
import type { EventoPresencial } from '@/lib/eventos/tipos'
import { ROTAS_EVENTO, ehRotaDeEvento } from '@/lib/eventos/rotas'
import { EVENTO_GU } from '@/app/gubigdata/evento'
import { EVENTO_CAFE } from '@/app/cafe-networking/evento'

// Cada edição de um evento presencial é um produto novo (`<evento>-AAAA-MM`), e a
// URL é sempre a CORRENTE. Trocar de edição toca em sete lugares — registry, rótulos
// do admin, cobrança avulsa, e-mail, seed da migração, imagens e o desligamento dos
// tipos da edição anterior. Esquecer um deles não quebra build nenhum: o site sobe
// bonito e a venda cai no balde errado, sem aba, ou o e-mail vira texto genérico.
// Este arquivo é o alarme, e vale pros dois eventos de uma vez.

const RAIZ = join(__dirname, '..', '..', '..')
const PRECO_GERAL_CENTAVOS = 3000 // R$ 30,00 — espelha o tipo `geral` cadastrado no admin

/** Um caso por evento em cartaz: o que muda é o objeto, nunca a regra. */
const EVENTOS: Array<{
  nome: string
  evento: EventoPresencial
  /** Trecho que precisa aparecer no assunto do e-mail de confirmação. */
  assuntoContem: RegExp
  /** Arquivos de rota que não podem carregar data escrita à mão. */
  paginas: string[]
}> = [
  {
    nome: 'encontro do GU BigData',
    evento: EVENTO_GU,
    assuntoContem: /GU BigData/i,
    paginas: ['src/app/gubigdata/page.tsx', 'src/app/gubigdata/inscricao/page.tsx'],
  },
  {
    nome: 'café de networking do DSSBR',
    evento: EVENTO_CAFE,
    assuntoContem: /Café de Networking/i,
    paginas: ['src/app/cafe-networking/page.tsx', 'src/app/cafe-networking/inscricao/page.tsx'],
  },
]

describe.each(EVENTOS)('$nome — evento em cartaz', ({ evento, assuntoContem, paginas }) => {
  it('o slug em cartaz está no registry, com o preço e as parcelas do ingresso Geral', () => {
    const p = PRODUTOS[evento.slug]
    expect(p, `${evento.slug} não existe em lib/produtos.ts`).toBeDefined()
    expect(p.precoCentavos, 'fallback do registry ≠ preço do tipo Geral').toBe(PRECO_GERAL_CENTAVOS)
    expect(p.maxParcelas).toBe(3)
    // Evento de R$30: PJ não trava por endereço (o atrito custa mais que a nota) — e
    // o formulário lê essa regra do evento, então os dois têm que concordar.
    expect(p.enderecoObrigatorioPJ).toBe(false)
    expect(evento.enderecoObrigatorioPJ).toBe(p.enderecoObrigatorioPJ)
    expect(p.voltarUrl).toBe(evento.baseUrl)
  })

  it('a data do evento aparece na descrição que vai pro Asaas — e é a mesma da página', () => {
    expect(PRODUTOS[evento.slug].asaasDescricao).toContain(evento.dataCurta)
    expect(PRODUTO_LABEL[evento.slug]).toContain(evento.dataCurta)
  })

  it('o painel sabe o que é: rótulo, aba e link de onde se compra', () => {
    expect(PRODUTO_LABEL[evento.slug], 'sem rótulo no admin').toBeTruthy()
    expect(PRODUTO_TAB[evento.slug], 'sem aba na lista de vendas').toBeTruthy()
    expect(CHECKOUT_URL[evento.slug]).toBe(`${evento.baseUrl}/inscricao`)
  })

  it('a cobrança avulsa fatura a edição corrente, com o preço do Geral sugerido', () => {
    expect(getOpcaoCobranca(evento.slug), 'sumiu do seletor de /admin/cobranca').not.toBeNull()
    expect(precosSugeridosCobranca()[evento.slug].centavos).toBe(PRECO_GERAL_CENTAVOS)
  })

  it('o e-mail de pagamento confirmado tem texto próprio, não o genérico', () => {
    const c = conteudoCompraConfirmada({
      nome: 'Fulano de Tal',
      valorCentavos: PRECO_GERAL_CENTAVOS,
      produtoSlug: evento.slug,
    })
    expect(c.assunto).not.toBe('Pagamento confirmado — Azuris')
    expect(c.assunto).toMatch(assuntoContem)
  })

  it('a migração semeia os dois tipos da edição — e nenhum deles expira sozinho', () => {
    const migracao = readFileSync(join(RAIZ, 'src/app/api/admin/migrate/route.ts'), 'utf8')
    const seed = migracao.split('\n').filter((l) => l.includes(`'${evento.slug}'`))
    expect(seed.length, `sem seed de tipos pro ${evento.slug} na migração`).toBe(2)
    expect(seed.some((l) => l.includes("'geral'")), 'sem o ingresso Geral').toBe(true)
    expect(seed.filter((l) => l.includes("'geral'")).length, 'mais de um tipo pago').toBe(1)
    // 30/07: os dois tipos tinham vendas_ate e fecharam o checkout à meia-noite do dia
    // do evento, na cara do público. Desde 01/08 a regra da casa é que nada expira sozinho.
    for (const linha of seed) {
      expect(linha, 'tipo nasceu com data de encerramento — ver o incidente de 30/07').not.toMatch(/DATE '/)
    }
  })

  it('o rodapé do checkout e o e-mail apontam pro endpoint deste evento', () => {
    expect(evento.apiUrl).toBe(`/api${evento.baseUrl}/inscricao`)
    expect(existsSync(join(RAIZ, 'src/app', evento.apiUrl, 'route.ts')), 'rota de API não existe').toBe(true)
  })

  // O café nasceu com o botão de WhatsApp da Azuris por cima do card de ingressos:
  // a regra de esconder widgets estava escrita como '/gubigdata' dentro de cada widget.
  it('os widgets globais da Azuris ficam fora da rota do evento', () => {
    expect(ROTAS_EVENTO, `${evento.baseUrl} não está em lib/eventos/rotas.ts`).toContain(evento.baseUrl)
    expect(ehRotaDeEvento(`${evento.baseUrl}/inscricao`)).toBe(true)
  })

  it('as imagens que a página referencia existem no public/', () => {
    const arquivos = [evento.banner.src, ...evento.palestrantes.map((p) => p.foto)]
    for (const a of arquivos) {
      expect(existsSync(join(RAIZ, 'public', a)), `${a} não está no public/`).toBe(true)
    }
  })

  // As páginas não podem ter data escrita à mão: em 26/08 as duas `description` de
  // metadata do GU ficaram falando do encontro de agosto depois da troca (SEO e link
  // compartilhado anunciando evento errado, sem quebrar build nenhum). Quem diz a data
  // é o evento.ts — aqui a gente reprova qualquer dd/mm solto nos arquivos de rota.
  it('nenhuma página carrega data de edição escrita à mão', () => {
    for (const p of paginas) {
      const fonte = readFileSync(join(RAIZ, p), 'utf8')
      const datas = fonte.match(/\b\d{2}\/\d{2}\b/g) ?? []
      expect(datas, `${p} tem data fixa (${datas.join(', ')}) — use o evento.ts`).toEqual([])
    }
  })
})

describe('componentes compartilhados de evento', () => {
  // O TicketBox e o formulário são os MESMOS pros dois eventos ([[eventos/tipos]]).
  // Uma rota escrita dentro deles mandaria o público do café pro checkout do GU.
  it('não têm rota de evento escrita dentro', () => {
    const compartilhados = [
      'src/components/evento/TicketBox.tsx',
      'src/components/evento/InscricaoEventoForm.tsx',
      'src/components/evento/PaginaEvento.tsx',
      'src/components/evento/PaginaCheckoutEvento.tsx',
    ]
    for (const p of compartilhados) {
      const fonte = readFileSync(join(RAIZ, p), 'utf8')
      for (const rota of ['/gubigdata', '/cafe-networking']) {
        expect(fonte, `${p} cita ${rota} — parametrize pelo evento`).not.toContain(rota)
      }
    }
  })

  it('os dois eventos em cartaz têm slug, URL e endpoint distintos', () => {
    expect(EVENTO_GU.slug).not.toBe(EVENTO_CAFE.slug)
    expect(EVENTO_GU.baseUrl).not.toBe(EVENTO_CAFE.baseUrl)
    expect(EVENTO_GU.apiUrl).not.toBe(EVENTO_CAFE.apiUrl)
  })
})
