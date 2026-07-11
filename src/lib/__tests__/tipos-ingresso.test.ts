import { describe, it, expect } from 'vitest'
import { disponibilidadeDoTipo, ehGratuito, precosDoTipo, valorCobradoDoTipo, type TipoIngresso } from '@/lib/tipos-ingresso'

const base: TipoIngresso = {
  id: 1,
  produto_slug: 'gubigdata-2026-07',
  tipo_id: 'geral',
  nome: 'Geral',
  descricao: null,
  preco_centavos: 3000,
  preco_de_centavos: 0,
  pix_desconto_pct: 0,
  cartao_acrescimo_pct: 0,
  max_parcelas: 3,
  ativo: true,
  ordem: 0,
  vendas_ate: null,
  limite_qtd: null,
}

describe('ehGratuito', () => {
  it('preço 0 = gratuito; qualquer outro = pago', () => {
    expect(ehGratuito({ ...base, preco_centavos: 0 })).toBe(true)
    expect(ehGratuito(base)).toBe(false)
  })
})

describe('disponibilidadeDoTipo', () => {
  it('sem prazo nem limite → sempre disponível', () => {
    expect(disponibilidadeDoTipo(base, '2026-07-11', 999)).toEqual({ disponivel: true, motivo: null })
  })

  it('inativo → encerrado', () => {
    expect(disponibilidadeDoTipo({ ...base, ativo: false }, '2026-07-11', 0).motivo).toBe('encerrado')
  })

  it('vendas_ate é inclusive: vende no dia, encerra no dia seguinte', () => {
    const t = { ...base, vendas_ate: '2026-07-29' }
    expect(disponibilidadeDoTipo(t, '2026-07-29', 0).disponivel).toBe(true)
    expect(disponibilidadeDoTipo(t, '2026-07-30', 0)).toEqual({ disponivel: false, motivo: 'encerrado' })
  })

  it('limite_qtd: abaixo vende, atingido esgota', () => {
    const t = { ...base, limite_qtd: 50 }
    expect(disponibilidadeDoTipo(t, '2026-07-11', 49).disponivel).toBe(true)
    expect(disponibilidadeDoTipo(t, '2026-07-11', 50)).toEqual({ disponivel: false, motivo: 'esgotado' })
  })

  it('encerrado tem precedência sobre esgotado', () => {
    const t = { ...base, vendas_ate: '2026-07-01', limite_qtd: 1 }
    expect(disponibilidadeDoTipo(t, '2026-07-11', 5).motivo).toBe('encerrado')
  })
})

describe('preços do tipo gratuito', () => {
  it('tudo zera e cobrança seria 0 (o checkout nunca chama Asaas nesse caso)', () => {
    const gratis = { ...base, preco_centavos: 0, max_parcelas: 1 }
    const p = precosDoTipo(gratis)
    expect(p.precoPixReais).toBe(0)
    expect(p.precoCartaoBaseReais).toBe(0)
    expect(valorCobradoDoTipo(gratis, 'PIX', 1).valorCentavos).toBe(0)
  })
})

describe('preços do tipo Geral GU (R$ 30, sem desconto/acréscimo)', () => {
  it('PIX e cartão 1x cobram R$ 30,00', () => {
    expect(valorCobradoDoTipo(base, 'PIX', 1).valorReais).toBe(30)
    expect(valorCobradoDoTipo(base, 'CREDIT_CARD', 1).valorReais).toBe(30)
  })

  it('cartão 3x embute juros e respeita max_parcelas', () => {
    const c = valorCobradoDoTipo(base, 'CREDIT_CARD', 3)
    expect(c.installments).toBe(3)
    expect(c.valorReais).toBeGreaterThan(30)
    // pedir 5x num tipo com teto 3x → clampa em 3
    expect(valorCobradoDoTipo(base, 'CREDIT_CARD', 5).installments).toBe(3)
  })
})
