import { describe, it, expect } from 'vitest'
import {
  OPCOES_COBRANCA,
  getOpcaoCobranca,
  descricaoManual,
  PREFIXO_MANUAL,
  PROPOSTA_SLUG,
} from '@/lib/cobranca-manual'
import { precosSugeridosCobranca, PRODUTO_TAB } from '@/lib/admin-queries'
import { PRODUTOS } from '@/lib/produtos'

describe('OPCOES_COBRANCA', () => {
  it('cobre os baldes: curso, DSS (full + One Day), GU e customizado', () => {
    expect(OPCOES_COBRANCA.map((o) => o.slug)).toEqual([
      'lakehouse-comunidade',
      'dss-2026',
      'dss-one-day-2026',
      'dss-one-day-curso-2026',
      'gubigdata-2026-07',
      PROPOSTA_SLUG,
    ])
  })

  it('todo slug tem rótulo de aba no painel — senão a venda some numa aba sem nome', () => {
    for (const o of OPCOES_COBRANCA) {
      expect(PRODUTO_TAB[o.slug], `sem PRODUTO_TAB para ${o.slug}`).toBeTruthy()
    }
  })

  it('endereço de PJ espelha a regra do checkout público do produto', () => {
    expect(getOpcaoCobranca('dss-2026')?.enderecoObrigatorioPJ).toBe(
      PRODUTOS['dss-2026'].enderecoObrigatorioPJ,
    )
    // GU é a exceção documentada: evento de comunidade de R$30 não trava por endereço.
    expect(getOpcaoCobranca('gubigdata-2026-07')?.enderecoObrigatorioPJ).toBe(false)
    // Proposta corporativa é o caminho de PJ que mais vira nota.
    expect(getOpcaoCobranca(PROPOSTA_SLUG)?.enderecoObrigatorioPJ).toBe(true)
  })

  it('só o customizado nasce sem descrição sugerida', () => {
    for (const o of OPCOES_COBRANCA) {
      if (o.slug === PROPOSTA_SLUG) expect(o.descricaoPadrao).toBe('')
      else expect(o.descricaoPadrao.length).toBeGreaterThan(3)
    }
  })
})

describe('getOpcaoCobranca', () => {
  it('recusa slug fora da allowlist — curso_slug vem do client', () => {
    expect(getOpcaoCobranca('assinatura')).toBeNull()
    expect(getOpcaoCobranca('preparatorio-dados')).toBeNull() // reserva não cobra
    expect(getOpcaoCobranca('')).toBeNull()
    expect(getOpcaoCobranca('../../etc')).toBeNull()
  })
  it('aceita os slugs da allowlist', () => {
    expect(getOpcaoCobranca('dss-2026')?.label).toBe('Ingresso DSS')
    expect(getOpcaoCobranca(PROPOSTA_SLUG)?.label).toBe('Customizado')
  })
})

describe('descricaoManual', () => {
  it('extrai a descrição do prefixo novo', () => {
    expect(descricaoManual(`${PREFIXO_MANUAL}8 ingressos DSS`)).toBe('8 ingressos DSS')
  })
  it('ainda lê as linhas antigas (prefixo legado em prod)', () => {
    expect(descricaoManual('Proposta customizada: Consultoria')).toBe('Consultoria')
  })
  it('null quando a venda não é manual', () => {
    expect(descricaoManual('Indicação de um amigo')).toBeNull()
    expect(descricaoManual(null)).toBeNull()
    expect(descricaoManual('')).toBeNull()
  })
})

describe('precosSugeridosCobranca', () => {
  const precos = precosSugeridosCobranca()

  it('sugere o preço de tabela de cada produto real', () => {
    expect(precos['dss-2026'].centavos).toBe(PRODUTOS['dss-2026'].precoCentavos)
    expect(precos['gubigdata-2026-07'].centavos).toBe(PRODUTOS['gubigdata-2026-07'].precoCentavos)
    expect(precos['lakehouse-comunidade'].centavos).toBe(75000) // não-membro
  })

  it('customizado não tem sugestão — o campo nasce vazio', () => {
    expect(precos[PROPOSTA_SLUG]).toBeUndefined()
  })

  it('a dica diz de onde veio o número', () => {
    expect(precos['lakehouse-comunidade'].dica).toContain('550') // preço de membro
    expect(precos['dss-2026'].dica).toContain('820') // âncora do preço cheio
  })
})
