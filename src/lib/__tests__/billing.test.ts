import { describe, it, expect } from 'vitest'
import { labelBilling } from '@/lib/billing'

describe('labelBilling', () => {
  it('rotula os 4 meios', () => {
    expect(labelBilling('PIX')).toBe('PIX')
    expect(labelBilling('CREDIT_CARD')).toBe('Cartão')
    expect(labelBilling('BOLETO')).toBe('Boleto')
    expect(labelBilling('UNDEFINED')).toBe('Cliente escolhe')
  })
  it('null/desconhecido degrada sem quebrar', () => {
    expect(labelBilling(null)).toBe('—')
    expect(labelBilling('OUTRO')).toBe('OUTRO')
  })
})
