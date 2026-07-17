import { describe, it, expect } from 'vitest'
import { valorParcela, totalComJuros, valorParcelaSemJuros, MAX_PARCELAS, MAX_PARCELAS_ADMIN, TAXA_JUROS_AM } from '@/lib/parcelamento'

describe('parcelamento', () => {
  it('1x é à vista, sem juros', () => {
    expect(valorParcela(550, 1)).toBe(550)
    expect(totalComJuros(550, 1)).toBe(550)
  })

  it('n<=1 nunca acrescenta juros', () => {
    expect(valorParcela(300, 0)).toBe(300)
  })

  it('parcela em 2x+ embute juros (Price) e sempre 2 casas', () => {
    const p = valorParcela(550, 3)
    expect(p).toBeGreaterThan(550 / 3) // parcela maior que a divisão simples
    expect(Number(p.toFixed(2))).toBe(p) // já vem com 2 casas
  })

  it('total com juros >= total base pra qualquer n de 1 a MAX_PARCELAS', () => {
    for (let n = 1; n <= MAX_PARCELAS; n++) {
      expect(totalComJuros(550, n)).toBeGreaterThanOrEqual(550)
    }
  })

  it('total com juros é monotônico crescente no nº de parcelas', () => {
    let anterior = 0
    for (let n = 1; n <= MAX_PARCELAS; n++) {
      const t = totalComJuros(1000, n)
      expect(t).toBeGreaterThanOrEqual(anterior)
      anterior = t
    }
  })

  it('fixture numérico conhecido — 550 em 3x @ 2,99% a.m.', () => {
    // PMT = P*i / (1 - (1+i)^-n)
    const i = TAXA_JUROS_AM
    const esperado = Number(((550 * i) / (1 - Math.pow(1 + i, -3))).toFixed(2))
    expect(valorParcela(550, 3)).toBe(esperado)
    expect(totalComJuros(550, 3)).toBe(Number((esperado * 3).toFixed(2)))
  })

  it('sem juros: parcela é a divisão simples e 1x é o total cheio', () => {
    expect(valorParcelaSemJuros(500, 1)).toBe(500)
    expect(valorParcelaSemJuros(500, 4)).toBe(125)
    // arredonda a 2 casas mesmo quando não divide exato (o Asaas ajusta via totalValue)
    expect(valorParcelaSemJuros(500, 3)).toBe(166.67)
    // sempre <= parcela com juros pro mesmo n
    expect(valorParcelaSemJuros(550, 3)).toBeLessThan(valorParcela(550, 3))
  })

  it('o teto do admin é maior que o público', () => {
    expect(MAX_PARCELAS_ADMIN).toBeGreaterThan(MAX_PARCELAS)
  })
})
