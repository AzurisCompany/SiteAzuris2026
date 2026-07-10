import { describe, it, expect, beforeEach } from 'vitest'
import { mapAsaasStatus, createPayment, parsePayment, __setAsaasFetch } from '@/lib/asaas'

describe('mapAsaasStatus', () => {
  it('mapeia os status pagos', () => {
    for (const s of ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']) expect(mapAsaasStatus(s)).toBe('paid')
  })
  it('overdue / refund / deleted', () => {
    expect(mapAsaasStatus('OVERDUE')).toBe('overdue')
    expect(mapAsaasStatus('REFUNDED')).toBe('refunded')
    expect(mapAsaasStatus('CHARGEBACK_REQUESTED')).toBe('refunded')
    expect(mapAsaasStatus('DELETED')).toBe('cancelled')
  })
  it('status desconhecido cai em pending (o default perigoso)', () => {
    expect(mapAsaasStatus('QUALQUER_COISA')).toBe('pending')
    expect(mapAsaasStatus('')).toBe('pending')
  })
})

describe('parsePayment (boundary)', () => {
  it('aceita payment com id + invoiceUrl', () => {
    expect(parsePayment({ id: 'p1', invoiceUrl: 'http://x' }, 'ctx').id).toBe('p1')
  })
  it('lança se faltar id, invoiceUrl, ou for nulo', () => {
    expect(() => parsePayment({ invoiceUrl: 'http://x' }, 'ctx')).toThrow()
    expect(() => parsePayment({ id: 'p1' }, 'ctx')).toThrow()
    expect(() => parsePayment(null, 'ctx')).toThrow()
  })
})

describe('createPayment — body builder', () => {
  let lastBody: Record<string, unknown>
  const fakePayment = { id: 'p1', invoiceUrl: 'http://x', value: 100, netValue: 95, status: 'PENDING', dueDate: '2026-01-01', billingType: 'PIX', customer: 'c1' }
  beforeEach(() => {
    __setAsaasFetch(async (_url, init) => {
      lastBody = JSON.parse(String(init?.body ?? '{}'))
      return new Response(JSON.stringify(fakePayment), { status: 200 })
    })
  })

  const base = { customerId: 'c', valueReais: 100, description: 'x', dueDate: '2026-01-01' as const }

  it('PIX usa value, sem installment*', async () => {
    await createPayment({ ...base, billingType: 'PIX' })
    expect(lastBody.value).toBe(100)
    expect(lastBody.installmentCount).toBeUndefined()
  })
  it('BOLETO usa value', async () => {
    await createPayment({ ...base, billingType: 'BOLETO' })
    expect(lastBody.value).toBe(100)
  })
  it('cartão 1x usa value (não parcela)', async () => {
    await createPayment({ ...base, billingType: 'CREDIT_CARD', installmentCount: 1 })
    expect(lastBody.value).toBe(100)
    expect(lastBody.installmentCount).toBeUndefined()
  })
  it('cartão parcelado usa installmentCount+installmentValue, SEM value', async () => {
    await createPayment({ ...base, valueReais: 300, billingType: 'CREDIT_CARD', installmentCount: 3, installmentValueReais: 105 })
    expect(lastBody.installmentCount).toBe(3)
    expect(lastBody.installmentValue).toBe(105)
    expect(lastBody.value).toBeUndefined()
  })
  it('externalReference só quando presente', async () => {
    await createPayment({ ...base, billingType: 'PIX' })
    expect(lastBody.externalReference).toBeUndefined()
    await createPayment({ ...base, billingType: 'PIX', externalReference: 'ref:1' })
    expect(lastBody.externalReference).toBe('ref:1')
  })
})
