import { describe, it, expect } from 'vitest'
import { PLANOS_ETT, getPlanoEtt, economiaAnualCentavos, ETT_ASSINATURA_SLUG } from '@/lib/ett'
import { PRODUTOS } from '@/lib/produtos'
import { PRODUTO_TAB } from '@/lib/admin-queries'

describe('planos da assinatura do ETT', () => {
  it('mensal e anual são os preços anunciados na home do ETT', () => {
    expect(getPlanoEtt('mensal')?.valorCentavos).toBe(3700)
    expect(getPlanoEtt('anual')?.valorCentavos).toBe(37000)
  })

  it('cada plano tem o ciclo certo no Asaas — trocar isso muda a frequência da cobrança', () => {
    expect(getPlanoEtt('mensal')?.cycle).toBe('MONTHLY')
    expect(getPlanoEtt('anual')?.cycle).toBe('YEARLY')
  })

  it('recusa plano fora da lista — o id vem do client, o preço não', () => {
    expect(getPlanoEtt('gratis')).toBeNull()
    expect(getPlanoEtt('')).toBeNull()
    expect(getPlanoEtt(undefined)).toBeNull()
    expect(getPlanoEtt('MENSAL')).toBeNull() // case-sensitive de propósito
  })

  it('o anual economiza exatamente 2 mensalidades', () => {
    const mensal = getPlanoEtt('mensal')!.valorCentavos
    expect(economiaAnualCentavos()).toBe(2 * mensal)
    // A promessa da home é "dois meses de desconto": anual = 10 mensalidades.
    expect(getPlanoEtt('anual')!.valorCentavos).toBe(10 * mensal)
  })

  it('toda descrição vai identificável na fatura do cliente', () => {
    for (const p of PLANOS_ETT) {
      expect(p.descricao).toContain('ETT')
      expect(p.descricao.length).toBeGreaterThan(10)
    }
  })
})

describe('produtos do ETT no painel', () => {
  it('adesão é cobrança única de R$67, sem desconto e sem âncora', () => {
    const p = PRODUTOS['ett-adesao']
    expect(p.precoCentavos).toBe(6700)
    expect(p.pixDescontoPct).toBe(0)
    expect(p.cartaoAcrescimoPct).toBe(0)
    expect(p.precoDeVendaCentavos).toBe(0)
  })

  it('adesão não trava PJ por endereço — é produto de pessoa física', () => {
    expect(PRODUTOS['ett-adesao'].enderecoObrigatorioPJ).toBe(false)
  })

  it('os dois slugs têm aba no painel — senão a venda cai numa aba sem nome', () => {
    expect(PRODUTO_TAB['ett-adesao']).toBeTruthy()
    expect(PRODUTO_TAB[ETT_ASSINATURA_SLUG]).toBeTruthy()
  })
})
