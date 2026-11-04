import { describe, it, expect, vi, beforeEach } from 'vitest'

// Cobrança apagada no painel do Asaas: o GET devolve `deleted: true` com o status de antes
// (PENDING/OVERDUE). O sync tem que cancelar aqui — senão a venda fica pendente pra sempre.
const getPayment = vi.fn()
const consolidarAsaas = vi.fn()

vi.mock('@/lib/asaas', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/asaas')>()),
  getPayment: (id: string) => getPayment(id),
}))
vi.mock('@/lib/db', () => ({
  consolidarAsaas: (id: string, d: unknown) => consolidarAsaas(id, d),
  sql: () => Promise.resolve([]),
}))

import { sincronizarInscricao } from '@/lib/asaas-sync'

const base = { id: 'pay_1', value: 550, netValue: 530, dueDate: '2026-10-01' }

describe('sincronizarInscricao — cobrança apagada no Asaas', () => {
  beforeEach(() => {
    getPayment.mockReset()
    consolidarAsaas.mockReset()
  })

  it('PENDING apagada vira cancelled (e asaas_status DELETED)', async () => {
    getPayment.mockResolvedValue({ ...base, status: 'PENDING', deleted: true })
    const r = await sincronizarInscricao({ asaas_payment_id: 'pay_1' })
    expect(r).toEqual({ ok: true, status: 'cancelled' })
    expect(consolidarAsaas.mock.calls[0][1]).toMatchObject({ status: 'cancelled', asaas_status: 'DELETED', paid_at: null })
  })

  it('OVERDUE apagada vira cancelled', async () => {
    getPayment.mockResolvedValue({ ...base, status: 'OVERDUE', deleted: true })
    expect((await sincronizarInscricao({ asaas_payment_id: 'pay_1' })).status).toBe('cancelled')
  })

  it('pago continua pago mesmo com deleted (dinheiro manda)', async () => {
    getPayment.mockResolvedValue({ ...base, status: 'RECEIVED', deleted: true, paymentDate: '2026-10-02' })
    expect((await sincronizarInscricao({ asaas_payment_id: 'pay_1' })).status).toBe('paid')
  })

  it('sem deleted, nada muda: PENDING segue pending', async () => {
    getPayment.mockResolvedValue({ ...base, status: 'PENDING' })
    const r = await sincronizarInscricao({ asaas_payment_id: 'pay_1' })
    expect(r.status).toBe('pending')
    expect(consolidarAsaas.mock.calls[0][1]).toMatchObject({ asaas_status: 'PENDING' })
  })
})
