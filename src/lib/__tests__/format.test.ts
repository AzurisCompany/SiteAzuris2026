import { describe, it, expect } from 'vitest'
import { onlyDigits, todayPlusDays, hojeBRT } from '@/lib/format'

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
