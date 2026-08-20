import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PRODUTOS } from '@/lib/produtos'
import { PRODUTO_LABEL, PRODUTO_TAB, CHECKOUT_URL, precosSugeridosCobranca } from '@/lib/admin-queries'
import { getOpcaoCobranca } from '@/lib/cobranca-manual'
import { conteudoCompraConfirmada } from '@/lib/email/conteudo'
import { EVENTO_GU, EVENTO_GU_SLUG } from '@/app/gubigdata/evento'

// Cada encontro do GU é um produto novo (`gubigdata-AAAA-MM`) e /gubigdata é sempre
// o CORRENTE. Trocar de encontro toca em seis lugares — registry, rótulos do admin,
// cobrança avulsa, e-mail, seed da migração e as imagens. Esquecer um deles não
// quebra build nenhum: o site sobe bonito e a venda cai no balde errado, sem aba,
// ou o e-mail de confirmação vira texto genérico. Este arquivo é o alarme.

const RAIZ = join(__dirname, '..', '..', '..')
const PRECO_GERAL_CENTAVOS = 3000 // R$ 30,00 — espelha o tipo `geral` cadastrado no admin

describe('encontro corrente do GU BigData', () => {
  it('o slug em cartaz está no registry, com o preço e as parcelas do ingresso Geral', () => {
    const p = PRODUTOS[EVENTO_GU_SLUG]
    expect(p, `${EVENTO_GU_SLUG} não existe em lib/produtos.ts`).toBeDefined()
    expect(p.precoCentavos, 'fallback do registry ≠ preço do tipo Geral').toBe(PRECO_GERAL_CENTAVOS)
    expect(p.maxParcelas).toBe(3)
    // Evento de comunidade de R$30: PJ não trava por endereço (o atrito custa mais que a nota).
    expect(p.enderecoObrigatorioPJ).toBe(false)
    expect(p.voltarUrl).toBe('/gubigdata')
  })

  it('a data do evento aparece na descrição que vai pro Asaas — e é a mesma da página', () => {
    expect(PRODUTOS[EVENTO_GU_SLUG].asaasDescricao).toContain(EVENTO_GU.dataCurta)
    expect(PRODUTO_LABEL[EVENTO_GU_SLUG]).toContain(EVENTO_GU.dataCurta)
  })

  it('o painel sabe o que é: rótulo, aba e link de onde se compra', () => {
    expect(PRODUTO_LABEL[EVENTO_GU_SLUG], 'sem rótulo no admin').toBeTruthy()
    expect(PRODUTO_TAB[EVENTO_GU_SLUG], 'sem aba na lista de vendas').toBeTruthy()
    expect(CHECKOUT_URL[EVENTO_GU_SLUG]).toBe('/gubigdata/inscricao')
  })

  it('a cobrança avulsa fatura o encontro corrente, com o preço do Geral sugerido', () => {
    expect(getOpcaoCobranca(EVENTO_GU_SLUG), 'o GU sumiu do seletor de /admin/cobranca').not.toBeNull()
    expect(precosSugeridosCobranca()[EVENTO_GU_SLUG].centavos).toBe(PRECO_GERAL_CENTAVOS)
  })

  it('o e-mail de pagamento confirmado tem texto próprio, não o genérico', () => {
    const c = conteudoCompraConfirmada({ nome: 'Fulano de Tal', valorCentavos: PRECO_GERAL_CENTAVOS, produtoSlug: EVENTO_GU_SLUG })
    expect(c.assunto).not.toBe('Pagamento confirmado — Azuris')
    expect(c.assunto).toMatch(/GU BigData/i)
  })

  it('a migração semeia os dois tipos do encontro — e nenhum deles expira sozinho', () => {
    const migracao = readFileSync(join(RAIZ, 'src/app/api/admin/migrate/route.ts'), 'utf8')
    const seed = migracao
      .split('\n')
      .filter((l) => l.includes(`'${EVENTO_GU_SLUG}'`))
    expect(seed.length, `sem seed de tipos pro ${EVENTO_GU_SLUG} na migração`).toBe(2)
    expect(seed.some((l) => l.includes("'geral'")), 'sem o ingresso Geral').toBe(true)
    expect(seed.some((l) => l.includes("'associado'")), 'sem o ingresso de associado').toBe(true)
    // 30/07: os dois tipos tinham vendas_ate e fecharam o checkout à meia-noite do dia
    // do evento, na cara do público. Desde 01/08 a regra da casa é que nada expira sozinho.
    for (const linha of seed) {
      expect(linha, 'tipo do GU nasceu com data de encerramento — ver o incidente de 30/07').not.toMatch(/DATE '/)
    }
  })

  it('as imagens que a página do evento referencia existem no public/', () => {
    const arquivos = [EVENTO_GU.banner.src, ...EVENTO_GU.palestrantes.map((p) => p.foto)]
    for (const a of arquivos) {
      expect(existsSync(join(RAIZ, 'public', a)), `${a} não está no public/`).toBe(true)
    }
  })
})
