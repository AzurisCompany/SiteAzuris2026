import { describe, it, expect, beforeEach } from 'vitest'
import { mapAsaasStatus, createPayment, parsePayment, findOrCreateCustomer, __setAsaasFetch } from '@/lib/asaas'

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

// O endereço só serve pra emitir nota se chegar no CADASTRO DO CLIENTE: o Asaas
// monta a NFS-e a partir dele, não do que mandamos em POST /invoices.
describe('findOrCreateCustomer — cadastro fiscal', () => {
  type Chamada = { url: string; method: string; body: Record<string, unknown> }
  let chamadas: Chamada[]

  const enderecoPJ = {
    company: 'Azuris LTDA',
    postalCode: '80010010',
    address: 'Rua XV de Novembro',
    addressNumber: '100',
    province: 'Centro',
  }

  /** Fake do Asaas: `existente` = o que o GET /customers?cpfCnpj= devolve. */
  function fake(existente: Record<string, unknown> | null) {
    chamadas = []
    __setAsaasFetch(async (url, init) => {
      const method = init?.method ?? 'GET'
      chamadas.push({ url: String(url), method, body: JSON.parse(String(init?.body ?? '{}')) })
      if (method === 'GET') {
        return new Response(JSON.stringify({ data: existente ? [existente] : [] }), { status: 200 })
      }
      return new Response(JSON.stringify({ id: 'c1', ...(existente ?? {}) }), { status: 200 })
    })
  }

  it('manda o endereço ao criar cliente novo', async () => {
    fake(null)
    await findOrCreateCustomer({ name: 'Azuris LTDA', email: 'a@x.com', cpfCnpj: '11222333000181', ...enderecoPJ })
    const post = chamadas.find((c) => c.method === 'POST')!
    expect(post.body).toMatchObject(enderecoPJ)
  })

  // Sem isso, quem já comprou antes fica preso ao cadastro incompleto da 1ª compra
  // e a nota dele nunca sai.
  it('atualiza o cadastro do cliente reusado quando chega endereço novo', async () => {
    fake({ id: 'c9', name: 'Azuris LTDA', email: 'a@x.com', cpfCnpj: '11222333000181' })
    const r = await findOrCreateCustomer({ name: 'Azuris LTDA', email: 'a@x.com', cpfCnpj: '11222333000181', ...enderecoPJ })
    const put = chamadas.find((c) => c.method === 'PUT')
    expect(put?.url).toContain('/customers/c9')
    expect(put?.body).toMatchObject(enderecoPJ)
    expect(r.id).toBe('c9') // update é parcial e preserva o id — não cria cliente novo
  })

  it('não faz PUT quando o cadastro já está igual', async () => {
    fake({ id: 'c9', name: 'Azuris LTDA', email: 'a@x.com', cpfCnpj: '11222333000181', ...enderecoPJ })
    await findOrCreateCustomer({ name: 'Azuris LTDA', email: 'a@x.com', cpfCnpj: '11222333000181', ...enderecoPJ })
    expect(chamadas.some((c) => c.method === 'PUT')).toBe(false)
  })

  it('PF sem endereço não manda campos vazios (o PUT sobrescreveria com nada)', async () => {
    fake({ id: 'c9', name: 'Fulano', email: 'f@x.com', cpfCnpj: '11144477735', postalCode: '80010010' })
    await findOrCreateCustomer({ name: 'Fulano', email: 'f@x.com', cpfCnpj: '11144477735', company: null })
    expect(chamadas.some((c) => c.method === 'PUT')).toBe(false)
  })

  // Cadastro é acessório; cobrança é o negócio. Um não pode derrubar o outro.
  it('falha ao atualizar cadastro não derruba a venda', async () => {
    chamadas = []
    __setAsaasFetch(async (url, init) => {
      const method = init?.method ?? 'GET'
      if (method === 'GET') {
        return new Response(JSON.stringify({ data: [{ id: 'c9', name: 'X', email: 'a@x.com', cpfCnpj: '11222333000181' }] }), { status: 200 })
      }
      return new Response('{"errors":[{"description":"boom"}]}', { status: 400 })
    })
    const r = await findOrCreateCustomer({ name: 'X', email: 'a@x.com', cpfCnpj: '11222333000181', ...enderecoPJ })
    expect(r.id).toBe('c9')
  })
})
