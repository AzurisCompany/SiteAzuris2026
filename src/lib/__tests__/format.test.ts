import { describe, it, expect } from 'vitest'
import { onlyDigits, todayPlusDays, hojeBRT, toISODate } from '@/lib/format'

describe('onlyDigits', () => {
  it('remove máscara', () => {
    expect(onlyDigits('111.444.777-35')).toBe('11144477735')
    expect(onlyDigits('(11) 98888-7777')).toBe('11988887777')
  })
  it('tolera null/undefined', () => {
    expect(onlyDigits(null)).toBe('')
    expect(onlyDigits(undefined)).toBe('')
  })
})

describe('hojeBRT', () => {
  it('retorna YYYY-MM-DD', () => {
    expect(hojeBRT()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('todayPlusDays', () => {
  it('retorna YYYY-MM-DD', () => {
    expect(todayPlusDays(3)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('0 dias = hoje BRT', () => {
    expect(todayPlusDays(0)).toBe(hojeBRT())
  })
  it('3 dias à frente > hoje', () => {
    expect(todayPlusDays(3) > todayPlusDays(0)).toBe(true)
  })
})

// O driver do Neon devolve DATE como objeto Date. Renderizar isso derrubava
// /admin/vendas/[id] inteira com "Objects are not valid as a React child".
describe('toISODate', () => {
  it('converte Date do driver preservando o dia (sem escorregar por fuso)', () => {
    // O driver monta o Date na meia-noite LOCAL do servidor — é isso que precisa
    // voltar como dia, independente do offset do fuso.
    const meiaNoiteLocal = new Date(2026, 6, 16, 0, 0, 0)
    expect(toISODate(meiaNoiteLocal)).toBe('2026-07-16')
  })
  it('não escorrega no fim do mês', () => {
    expect(toISODate(new Date(2026, 11, 31, 0, 0, 0))).toBe('2026-12-31')
  })
  it('aceita string que já vem no formato', () => {
    expect(toISODate('2026-07-16')).toBe('2026-07-16')
  })
  it('corta timestamp pra só o dia', () => {
    expect(toISODate('2026-07-16T03:00:00.000Z')).toBe('2026-07-16')
  })
  it('null e undefined viram null', () => {
    expect(toISODate(null)).toBeNull()
    expect(toISODate(undefined)).toBeNull()
  })
  it('Date inválida vira null em vez de "Invalid Date"', () => {
    expect(toISODate(new Date('nada'))).toBeNull()
  })
  it('lixo vira null', () => {
    expect(toISODate('16/07/2026')).toBeNull()
  })
})
