import { describe, it, expect } from 'vitest'
import { analisarVendas, diasEntre, DIAS_PARA_ESQUECER, type ProdutoVigiado } from '@/lib/vigilancia'
import type { TipoIngresso } from '@/lib/tipos-ingresso'

const HOJE = '2026-08-01'

function tipo(over: Partial<TipoIngresso> = {}): TipoIngresso {
  return {
    id: 1,
    produto_slug: 'p',
    tipo_id: 'lote-1',
    nome: 'Lote 1',
    descricao: null,
    preco_centavos: 57000,
    preco_de_centavos: 0,
    pix_desconto_pct: 0,
    cartao_acrescimo_pct: 0,
    max_parcelas: 3,
    ativo: true,
    ordem: 0,
    vendas_ate: null,
    limite_qtd: null,
    ...over,
  } as TipoIngresso
}

function produto(tipos: TipoIngresso[], inscritos: Record<string, number> = {}): ProdutoVigiado {
  return { slug: 'p', tipos, inscritos }
}

describe('diasEntre', () => {
  it('conta dias sem escorregar por fuso', () => {
    expect(diasEntre('2026-08-01', '2026-08-10')).toBe(9)
    expect(diasEntre('2026-08-10', '2026-08-01')).toBe(-9)
    expect(diasEntre('2026-08-01', '2026-08-01')).toBe(0)
  })
})

describe('analisarVendas', () => {
  it('silêncio quando nada está em risco — e-mail diário de "ok" vira e-mail ignorado', () => {
    expect(analisarVendas([produto([tipo()])], HOJE)).toEqual([])
    expect(analisarVendas([], HOJE)).toEqual([])
  })

  it('grita quando o produto fica sem NENHUMA opção de compra (o caso do GU)', () => {
    const a = analisarVendas([produto([tipo({ vendas_ate: '2026-07-31' })])], HOJE)
    expect(a).toHaveLength(1)
    expect(a[0].severidade).toBe('critico')
    expect(a[0].titulo).toBe('Sem opção de compra')
  })

  it('para de gritar de evento que já passou faz tempo', () => {
    const velho = analisarVendas([produto([tipo({ vendas_ate: '2026-07-01' })])], HOJE)
    expect(velho).toEqual([])
    // ...mas ainda avisa dentro da janela de esquecimento.
    const recente = analisarVendas(
      [produto([tipo({ vendas_ate: `2026-07-${String(32 - DIAS_PARA_ESQUECER).padStart(2, '0')}` })])],
      HOJE
    )
    expect(recente).toHaveLength(1)
  })

  it('avisa antes do prazo, e trata como crítico quando é a última opção', () => {
    const a = analisarVendas([produto([tipo({ vendas_ate: '2026-08-03' })])], HOJE)
    expect(a[0].titulo).toContain('2 dia')
    expect(a[0].severidade).toBe('critico') // única opção ativa
    expect(a[0].detalhe).toContain('ÚNICA')
  })

  it('com outra opção viva, o mesmo prazo é só aviso', () => {
    const a = analisarVendas([produto([tipo({ vendas_ate: '2026-08-03' }), tipo({ tipo_id: 'lote-2' })])], HOJE)
    expect(a).toHaveLength(1)
    expect(a[0].severidade).toBe('aviso')
  })

  it('avisa a partir de 80% da lotação, não quando já esgotou', () => {
    const semAlerta = analisarVendas([produto([tipo({ limite_qtd: 100 })], { 'lote-1': 79 })], HOJE)
    expect(semAlerta).toEqual([])
    const comAlerta = analisarVendas([produto([tipo({ limite_qtd: 100 })], { 'lote-1': 80 })], HOJE)
    expect(comAlerta[0].titulo).toBe('Restam 20 vaga(s)')
  })

  it('lotação estourada vira "sem opção de compra", não "restam 0 vagas"', () => {
    const a = analisarVendas([produto([tipo({ limite_qtd: 100 })], { 'lote-1': 100 })], HOJE)
    expect(a).toHaveLength(1)
    expect(a[0].titulo).toBe('Sem opção de compra')
  })

  it('crítico vem antes de aviso na lista — o e-mail abre pelo que dói', () => {
    const a = analisarVendas(
      [
        { slug: 'a', tipos: [tipo({ vendas_ate: '2026-08-02' }), tipo({ tipo_id: 'lote-2' })], inscritos: {} },
        { slug: 'b', tipos: [tipo({ produto_slug: 'b', vendas_ate: '2026-07-31' })], inscritos: {} },
      ],
      HOJE
    )
    expect(a[0].severidade).toBe('critico')
    expect(a.at(-1)!.severidade).toBe('aviso')
  })

  it('tipo inativo não gera aviso de prazo, mas conta pra falta de opção', () => {
    const a = analisarVendas([produto([tipo({ ativo: false, vendas_ate: '2026-08-02' })])], HOJE)
    expect(a).toHaveLength(1)
    expect(a[0].titulo).toBe('Sem opção de compra')
  })
})
