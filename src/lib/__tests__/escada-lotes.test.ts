import { describe, it, expect } from 'vitest'
import { montarEscada } from '@/lib/escada-lotes'
import type { TipoIngresso } from '@/lib/tipos-ingresso'

const tipo = (p: Partial<TipoIngresso>): TipoIngresso => ({
  id: 1,
  produto_slug: 'dss-2026',
  tipo_id: 'lote-x',
  nome: 'Lote X',
  descricao: null,
  preco_centavos: 0,
  preco_de_centavos: 0,
  pix_desconto_pct: 0,
  cartao_acrescimo_pct: 0,
  max_parcelas: 3,
  ativo: true,
  oculto: false,
  ordem: 0,
  vendas_ate: null,
  limite_qtd: null,
  ...p,
})

// O catálogo real do DSS depois da virada de 25/08/2026.
const CATALOGO = [
  tipo({ tipo_id: 'lote-1', nome: 'Lote 1', preco_centavos: 57000, preco_de_centavos: 82000, ativo: false, ordem: 3 }),
  tipo({ tipo_id: 'lote-2', nome: 'Lote 2', preco_centavos: 67000, preco_de_centavos: 82000, ativo: true, ordem: 1 }),
  tipo({ tipo_id: 'estudante', nome: 'Estudante', preco_centavos: 40000, preco_de_centavos: 67000, oculto: true, ordem: 2 }),
]

describe('escada de lotes', () => {
  it('põe o lote encerrado, o vigente e a âncora em ordem de preço', () => {
    expect(montarEscada(CATALOGO)).toEqual([
      { nome: 'Lote 1', valor: 570, estado: 'encerrado' },
      { nome: 'Lote 2', valor: 670, estado: 'atual' },
      { nome: 'No dia', valor: 820, estado: 'final' },
    ])
  })

  it('não expõe ingresso oculto como degrau', () => {
    expect(montarEscada(CATALOGO).map((d) => d.nome)).not.toContain('Estudante')
  })

  it('lote inativo MAIS CARO que o vigente é o próximo, não um encerrado', () => {
    const comLote3 = [...CATALOGO, tipo({ tipo_id: 'lote-3', nome: 'Lote 3', preco_centavos: 75000, ativo: false })]
    expect(montarEscada(comLote3).find((d) => d.nome === 'Lote 3')?.estado).toBe('proximo')
  })

  it('mostra no degrau vigente o preço que o link de desconto faz', () => {
    const escada = montarEscada(CATALOGO, { atualComCupomCentavos: 60300 })
    expect(escada.find((d) => d.estado === 'atual')).toEqual({
      nome: 'Lote 2',
      valor: 670,
      estado: 'atual',
      valorComCupom: 603,
    })
  })

  it('um lote sozinho e sem âncora não vira escada', () => {
    expect(montarEscada([tipo({ nome: 'Único', preco_centavos: 3000 })])).toEqual([])
  })

  it('sem lote ativo não há escada (catálogo todo desligado)', () => {
    expect(montarEscada(CATALOGO.map((t) => ({ ...t, ativo: false })))).toEqual([])
  })

  it('não duplica o degrau final quando a âncora é o preço de um lote cadastrado', () => {
    const ancoraIgualAoLote3 = [
      tipo({ tipo_id: 'lote-2', nome: 'Lote 2', preco_centavos: 67000, preco_de_centavos: 75000, ativo: true }),
      tipo({ tipo_id: 'lote-3', nome: 'Lote 3', preco_centavos: 75000, ativo: false }),
    ]
    const escada = montarEscada(ancoraIgualAoLote3)
    expect(escada).toHaveLength(2)
    expect(escada.map((d) => d.nome)).toEqual(['Lote 2', 'Lote 3'])
  })
})
