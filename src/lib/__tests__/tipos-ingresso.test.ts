import { describe, it, expect } from 'vitest'
import {
  aplicarTipoDoLink,
  disponibilidadeDoTipo,
  ehGratuito,
  precosDoTipo,
  valorCobradoDoTipo,
  type TipoIngresso,
} from '@/lib/tipos-ingresso'

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
  oculto: false,
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

// O ingresso reservado (Estudante do DSS, R$ 400) depende INTEIRAMENTE destas
// regras: se um oculto vazar pra vitrine, vira desconto aberto pra todo mundo.
describe('aplicarTipoDoLink (ingresso oculto, só por link)', () => {
  const lote1: TipoIngresso = { ...base, id: 7, produto_slug: 'dss-2026', tipo_id: 'lote-1', nome: 'Lote 1', preco_centavos: 57000, ordem: 1 }
  const estudante: TipoIngresso = { ...base, id: 9, produto_slug: 'dss-2026', tipo_id: 'estudante', nome: 'Estudante', preco_centavos: 40000, oculto: true, ordem: 2, limite_qtd: 50 }
  const hoje = '2026-08-14'

  it('sem ?tipo= a vitrine sai como está, sem nada pré-selecionado', () => {
    expect(aplicarTipoDoLink([lote1], null, null, hoje, 0)).toEqual({ tipos: [lote1], selecionado: null, recusa: null })
  })

  it('com o link certo, o oculto ENTRA na lista e já vem selecionado', () => {
    const r = aplicarTipoDoLink([lote1], 'estudante', estudante, hoje, 10)
    expect(r.tipos.map((t) => t.tipo_id)).toEqual(['lote-1', 'estudante'])
    expect(r.selecionado).toBe('estudante')
    expect(r.recusa).toBeNull()
  })

  it('id que não existe → vitrine pública e recusa explicada (nunca página de erro)', () => {
    const r = aplicarTipoDoLink([lote1], 'estudantee', null, hoje, 0)
    expect(r.tipos).toEqual([lote1])
    expect(r).toMatchObject({ selecionado: null, recusa: 'inexistente' })
  })

  it('lote de estudante esgotado (50/50) → cai no preço cheio, sem sumir com a inscrição', () => {
    const r = aplicarTipoDoLink([lote1], 'estudante', estudante, hoje, 50)
    expect(r.tipos.map((t) => t.tipo_id)).toEqual(['lote-1'])
    expect(r.recusa).toBe('indisponivel')
  })

  it('oculto desligado no admin não é vendido nem por link', () => {
    const r = aplicarTipoDoLink([lote1], 'estudante', { ...estudante, ativo: false }, hoje, 0)
    expect(r.selecionado).toBeNull()
    expect(r.recusa).toBe('indisponivel')
  })

  it('link pra um tipo que já está na vitrine só pré-seleciona, sem duplicar o card', () => {
    const r = aplicarTipoDoLink([lote1], 'lote-1', lote1, hoje, 0)
    expect(r.tipos).toEqual([lote1])
    expect(r.selecionado).toBe('lote-1')
  })

  it('a ordem do admin manda: oculto com ordem menor aparece antes do lote', () => {
    const r = aplicarTipoDoLink([lote1], 'estudante', { ...estudante, ordem: 0 }, hoje, 0)
    expect(r.tipos.map((t) => t.tipo_id)).toEqual(['estudante', 'lote-1'])
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
