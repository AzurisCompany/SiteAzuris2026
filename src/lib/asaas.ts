// Helper de API do Asaas. Sandbox por padrão (definido por ASAAS_BASE_URL).
// Doc oficial: https://docs.asaas.com/

const BASE_URL = process.env.ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3'
const API_KEY = process.env.ASAAS_API_KEY

if (!API_KEY) {
  // Sem chave, asaasFetch manda token vazio e o Asaas devolve 401 — o erro sobe
  // pras route handlers (try/catch → 502). Aviso pra facilitar o diagnóstico.
  console.warn('ASAAS_API_KEY não configurada. Configure via Vercel env vars.')
}

// Seam de injeção: por padrão o fetch global; testes trocam por um fake via
// __setAsaasFetch (sem tocar nas rotas). Ver DIP na revisão de arquitetura.
let _fetch: typeof fetch = (input, init) => fetch(input, init)
export function __setAsaasFetch(f: typeof fetch): void {
  _fetch = f
}

async function asaasFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await _fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: API_KEY ?? '',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Asaas ${res.status} ${path}: ${text}`)
  }
  return text ? JSON.parse(text) : {}
}

// --- Validação de boundary ---
// O Asaas é um serviço externo: não confiamos no shape do retorno. Estes guards
// FALHAM ALTO (lançam) em vez de deixar `undefined` virar vínculo gravado no banco.

function reqStr(raw: unknown, field: string, ctx: string): string {
  const v = (raw as Record<string, unknown> | null | undefined)?.[field]
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Asaas: resposta inválida em ${ctx} — campo "${field}" ausente`)
  }
  return v
}

/** Garante que um pagamento tem id + invoiceUrl antes de persistir o vínculo. */
export function parsePayment(raw: unknown, ctx: string): AsaasPayment {
  reqStr(raw, 'id', ctx)
  reqStr(raw, 'invoiceUrl', ctx)
  return raw as AsaasPayment
}

// --- Customer ---

export interface CreateCustomerInput {
  name: string
  email: string
  cpfCnpj: string
  mobilePhone?: string | null
  /** razão social — vai no campo `company` do Asaas (PJ) */
  company?: string | null
  /** Endereço do tomador. Sem ele a NFS-e não sai: o Asaas monta a nota a partir
   *  do CADASTRO DO CLIENTE, não do que mandamos em POST /invoices. */
  postalCode?: string | null
  address?: string | null
  addressNumber?: string | null
  complement?: string | null
  province?: string | null
}

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
  mobilePhone?: string
  company?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
}

/** Campos de cadastro (fora name/email/cpfCnpj) que sincronizamos com o Asaas. */
const CAMPOS_CADASTRO = ['company', 'postalCode', 'address', 'addressNumber', 'complement', 'province'] as const

/** Só os campos com valor — o Asaas trata update como patch e sobrescreveria com vazio. */
function camposComValor(input: CreateCustomerInput): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of CAMPOS_CADASTRO) {
    const v = input[k]
    if (typeof v === 'string' && v.trim()) out[k] = v.trim()
  }
  return out
}

/** Atualiza um cliente existente (PUT /customers/{id}, parcial). */
export async function updateCustomer(id: string, patch: Record<string, unknown>): Promise<AsaasCustomer> {
  const c = await asaasFetch(`/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
  reqStr(c, 'id', 'updateCustomer')
  return c as AsaasCustomer
}

export async function findOrCreateCustomer(input: CreateCustomerInput): Promise<AsaasCustomer> {
  const cadastro = camposComValor(input)

  // Procura por CPF/CNPJ primeiro
  const search = (await asaasFetch(`/customers?cpfCnpj=${encodeURIComponent(input.cpfCnpj)}`, {
    method: 'GET',
  })) as { data?: AsaasCustomer[] }
  if (Array.isArray(search?.data) && search.data.length > 0) {
    const existente = search.data[0] as AsaasCustomer
    // Cliente reusado: se ele chegou com endereço/razão social novos, atualiza o
    // cadastro. Sem isso, quem já comprou antes fica preso ao cadastro incompleto
    // da primeira compra e a nota dele nunca sai.
    const faltantes = Object.entries(cadastro).filter(([k, v]) => (existente[k as keyof AsaasCustomer] ?? '') !== v)
    if (faltantes.length > 0) {
      try {
        return await updateCustomer(existente.id, Object.fromEntries(faltantes))
      } catch (e) {
        // Atualizar cadastro não é motivo pra derrubar uma venda — a cobrança
        // funciona mesmo com endereço velho; só a NF pode precisar de correção.
        console.error('Falha ao atualizar cadastro do cliente no Asaas (cobrança segue):', e)
      }
    }
    return existente
  }

  const created = await asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj,
      mobilePhone: input.mobilePhone ?? undefined,
      notificationDisabled: false,
      ...cadastro,
    }),
  })
  return created as AsaasCustomer
}

/** Busca um cliente pelo id (GET /customers/{id}). Usado na importação de
 *  cobranças criadas fora do nosso fluxo (o payment só traz o id do cliente). */
export async function getCustomer(customerId: string): Promise<AsaasCustomer> {
  const c = await asaasFetch(`/customers/${encodeURIComponent(customerId)}`, { method: 'GET' })
  reqStr(c, 'id', 'getCustomer')
  return c as AsaasCustomer
}

// --- Payment ---

export type AsaasBillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'

export interface CreatePaymentInput {
  customerId: string
  billingType: AsaasBillingType
  valueReais: number // ex.: 550.00
  description: string
  externalReference?: string
  dueDate: string // YYYY-MM-DD
  installmentCount?: number // só pra CREDIT_CARD
  installmentValueReais?: number // só pra CREDIT_CARD (cada parcela) — parcelamento COM juros pré-fixado
  installmentTotalReais?: number // só pra CREDIT_CARD — parcelamento SEM juros: total dividido pelo Asaas
}

export interface AsaasPayment {
  id: string
  customer: string
  value: number
  netValue: number
  status: string
  billingType: AsaasBillingType
  dueDate: string
  invoiceUrl: string
  bankSlipUrl?: string
  description?: string
  externalReference?: string
  subscription?: string // preenchido quando o pagamento faz parte de uma assinatura
  installment?: string // preenchido quando é uma parcela de um parcelamento (id do parcelamento)
}

export async function createPayment(input: CreatePaymentInput): Promise<AsaasPayment> {
  // Pra CREDIT_CARD parcelado, o Asaas exige `installmentCount` + `installmentValue`
  // (sem `value`). Pra PIX/BOLETO, usa-se `value`.
  const body: Record<string, unknown> = {
    customer: input.customerId,
    billingType: input.billingType,
    dueDate: input.dueDate,
    description: input.description,
  }

  if (input.externalReference) {
    body.externalReference = input.externalReference
  }

  if (input.billingType === 'CREDIT_CARD' && input.installmentCount && input.installmentCount > 1) {
    body.installmentCount = input.installmentCount
    // SEM juros: manda o total e deixa o Asaas dividir (absorve o centavo do arredondamento).
    // COM juros: manda o valor pré-fixado de cada parcela (tabela Price).
    if (input.installmentTotalReais != null) {
      body.totalValue = input.installmentTotalReais
    } else {
      body.installmentValue = input.installmentValueReais
        ?? Number((input.valueReais / input.installmentCount).toFixed(2))
    }
  } else {
    body.value = input.valueReais
  }

  const payment = await asaasFetch('/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parsePayment(payment, 'createPayment')
}

/** Edita uma cobrança existente (PUT /payments/{id}). Só faz sentido pra não-paga. */
export interface UpdatePaymentInput {
  valueReais?: number
  dueDate?: string // YYYY-MM-DD
  description?: string
}

export async function updatePayment(paymentId: string, input: UpdatePaymentInput): Promise<AsaasPayment> {
  const body: Record<string, unknown> = {}
  if (typeof input.valueReais === 'number') body.value = input.valueReais
  if (input.dueDate) body.dueDate = input.dueDate
  if (input.description) body.description = input.description
  const payment = await asaasFetch(`/payments/${encodeURIComponent(paymentId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return parsePayment(payment, 'updatePayment')
}

/** Detalhe de uma cobrança (GET /payments/{id}). */
export interface AsaasPaymentDetail extends AsaasPayment {
  dueDate: string
  paymentDate?: string | null
  clientPaymentDate?: string | null
  confirmedDate?: string | null
}

export async function getPayment(paymentId: string): Promise<AsaasPaymentDetail> {
  const p = await asaasFetch(`/payments/${encodeURIComponent(paymentId)}`, { method: 'GET' })
  reqStr(p, 'id', 'getPayment')
  return p as AsaasPaymentDetail
}

/** Lista todas as parcelas de um parcelamento (GET /payments?installment={id}). */
export async function getInstallmentPayments(installmentId: string): Promise<AsaasPaymentDetail[]> {
  const r = (await asaasFetch(
    `/payments?installment=${encodeURIComponent(installmentId)}&limit=100`,
    { method: 'GET' },
  )) as { data?: AsaasPaymentDetail[] }
  return Array.isArray(r.data) ? r.data : []
}

/** Lista cobranças da conta (GET /payments), paginado. Usado pra mapear o que
 *  existe no Asaas mas não no nosso banco (cobranças criadas no painel). */
export async function listPayments(
  opts: { limit?: number; offset?: number; dateCreatedGe?: string; dateCreatedLe?: string } = {},
): Promise<{ data: AsaasPaymentDetail[]; totalCount: number; hasMore: boolean }> {
  const limit = opts.limit ?? 100
  const offset = opts.offset ?? 0
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  // Filtro por data de criação (YYYY-MM-DD). Recorta o escaneamento a um período.
  if (opts.dateCreatedGe) params.set('dateCreated[ge]', opts.dateCreatedGe)
  if (opts.dateCreatedLe) params.set('dateCreated[le]', opts.dateCreatedLe)
  const r = (await asaasFetch(`/payments?${params.toString()}`, { method: 'GET' })) as {
    data?: AsaasPaymentDetail[]
    totalCount?: number
    hasMore?: boolean
  }
  const data = Array.isArray(r.data) ? r.data : []
  return { data, totalCount: r.totalCount ?? data.length, hasMore: r.hasMore ?? false }
}

/** Remove uma cobrança não paga (DELETE /payments/{id}). Só serve pra pending/overdue. */
export async function deletePayment(paymentId: string): Promise<{ deleted: boolean; id: string }> {
  const r = (await asaasFetch(`/payments/${encodeURIComponent(paymentId)}`, { method: 'DELETE' })) as {
    deleted?: boolean
    id?: string
  }
  return { deleted: r.deleted === true, id: r.id ?? paymentId }
}

/** Remove um parcelamento inteiro e todas as suas parcelas (DELETE /installments/{id}).
 *  Uma cobrança parcelada no cartão vira N pagamentos agrupados por um `installment`;
 *  pra cancelar tudo, apaga-se o parcelamento, não parcela por parcela. */
export async function deleteInstallment(installmentId: string): Promise<{ deleted: boolean; id: string }> {
  const r = (await asaasFetch(`/installments/${encodeURIComponent(installmentId)}`, { method: 'DELETE' })) as {
    deleted?: boolean
    id?: string
  }
  return { deleted: r.deleted === true, id: r.id ?? installmentId }
}

/** Mapeia o status cru do Asaas pro nosso status normalizado. */
export function mapAsaasStatus(status: string): 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded' {
  switch (status) {
    case 'RECEIVED':
    case 'CONFIRMED':
    case 'RECEIVED_IN_CASH':
      return 'paid'
    case 'OVERDUE':
      return 'overdue'
    case 'REFUNDED':
    case 'REFUND_REQUESTED':
    case 'CHARGEBACK_REQUESTED':
    case 'CHARGEBACK_DISPUTE':
    case 'AWAITING_CHARGEBACK_REVERSAL':
      return 'refunded'
    case 'DELETED':
      return 'cancelled'
    default:
      return 'pending'
  }
}

// --- Finanças da conta (saldo + extrato) ---
// Usado pela reconciliação em /admin/saude: bate o saldo REAL da conta contra o
// "líquido recebido" que o banco acumula. Divergem por natureza (saque, antecipação,
// taxa não entram no banco) — o extrato explica a diferença item a item.

/** Saldo disponível pra saque na conta Asaas (GET /finance/balance). Em reais. */
export async function getBalance(): Promise<{ balanceReais: number }> {
  const r = (await asaasFetch('/finance/balance', { method: 'GET' })) as { balance?: number }
  if (typeof r.balance !== 'number') {
    throw new Error('Asaas: /finance/balance sem campo "balance" numérico')
  }
  return { balanceReais: r.balance }
}

export interface AsaasFinanceTransaction {
  date: string // YYYY-MM-DD
  value: number // sinalizado: crédito > 0, débito < 0. Em reais.
  balance: number // saldo corrente após a transação. Em reais.
  type: string // PAYMENT_RECEIVED, TRANSFER, CREDIT_CARD_ANTICIPATION, *_FEE, REFUND…
  description: string | null
}

/** Extrato financeiro (GET /financialTransactions), mais recentes primeiro.
 *  `value` já vem sinalizado pelo Asaas (crédito positivo, débito negativo). */
export async function getFinanceTransactions(
  limit = 50,
  offset = 0,
): Promise<{ transactions: AsaasFinanceTransaction[]; totalCount: number; hasMore: boolean }> {
  const r = (await asaasFetch(
    `/financialTransactions?limit=${limit}&offset=${offset}&order=desc`,
    { method: 'GET' },
  )) as { data?: unknown[]; totalCount?: number; hasMore?: boolean }
  const transactions = (r.data ?? []).map((raw) => {
    const t = raw as Record<string, unknown>
    return {
      date: typeof t.date === 'string' ? t.date : '',
      value: typeof t.value === 'number' ? t.value : 0,
      balance: typeof t.balance === 'number' ? t.balance : 0,
      type: typeof t.type === 'string' ? t.type : 'UNKNOWN',
      description: typeof t.description === 'string' ? t.description : null,
    }
  })
  return { transactions, totalCount: r.totalCount ?? transactions.length, hasMore: r.hasMore ?? false }
}

// --- Assinaturas (cobrança recorrente) ---

export type AsaasCycle = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'

export interface AsaasSubscription {
  id: string
  customer: string
  value: number
  cycle: AsaasCycle
  status: string
  billingType: AsaasBillingType
  nextDueDate?: string
  description?: string
}

export interface CreateSubscriptionInput {
  customerId: string
  billingType: AsaasBillingType
  valueReais: number
  cycle: AsaasCycle
  nextDueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<AsaasSubscription> {
  const body: Record<string, unknown> = {
    customer: input.customerId,
    billingType: input.billingType,
    value: input.valueReais,
    cycle: input.cycle,
    nextDueDate: input.nextDueDate,
  }
  if (input.description) body.description = input.description
  if (input.externalReference) body.externalReference = input.externalReference
  const sub = await asaasFetch('/subscriptions', { method: 'POST', body: JSON.stringify(body) })
  reqStr(sub, 'id', 'createSubscription')
  return sub as AsaasSubscription
}

export async function getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return (await asaasFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: 'GET' })) as AsaasSubscription
}

/**
 * Cobranças geradas por uma assinatura (GET /subscriptions/{id}/payments).
 * Usado pelo checkout público pra devolver o link da PRIMEIRA cobrança: criar a
 * subscription não devolve invoiceUrl, e sem ele o cliente assina e não paga nada.
 */
export async function getSubscriptionPayments(subscriptionId: string): Promise<AsaasPaymentDetail[]> {
  const r = (await asaasFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}/payments?limit=100`, {
    method: 'GET',
  })) as { data?: AsaasPaymentDetail[] }
  return Array.isArray(r.data) ? r.data : []
}

/** Cancela (deleta) uma assinatura no Asaas — para de gerar novos ciclos. */
export async function cancelSubscription(subscriptionId: string): Promise<{ deleted: boolean }> {
  return (await asaasFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: 'DELETE' })) as {
    deleted: boolean
  }
}

// --- Nota Fiscal (NFS-e) ---

export interface AsaasInvoice {
  id: string
  status: string // SCHEDULED | SYNCHRONIZED | AUTHORIZED | PROCESSING_CANCELLATION | CANCELED | CANCELLATION_DENIED | ERROR
  number?: string | null
  pdfUrl?: string | null
  xmlUrl?: string | null
  rpsNumber?: string | null
  value?: number
  payment?: string
  serviceDescription?: string
  effectiveDate?: string
}

export interface CreateInvoiceInput {
  paymentId: string
  valueReais: number
  serviceDescription: string
  observations?: string
  municipalServiceCode?: string
  municipalServiceName?: string
  effectiveDate?: string // YYYY-MM-DD
  taxes?: { iss?: number; retainIss?: boolean; cofins?: number; csll?: number; inss?: number; ir?: number; pis?: number }
}

/**
 * Agenda a emissão de uma NFS-e vinculada a um pagamento (POST /invoices).
 * Exige que a conta Asaas tenha as configurações fiscais preenchidas (inscrição
 * municipal, serviço, regime) — senão o Asaas devolve erro, que propagamos cru.
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<AsaasInvoice> {
  const body: Record<string, unknown> = {
    payment: input.paymentId,
    value: input.valueReais,
    serviceDescription: input.serviceDescription,
    updatePayment: false,
    taxes: input.taxes ?? { iss: 0, retainIss: false, cofins: 0, csll: 0, inss: 0, ir: 0, pis: 0 },
  }
  if (input.observations) body.observations = input.observations
  if (input.effectiveDate) body.effectiveDate = input.effectiveDate
  if (input.municipalServiceCode) body.municipalServiceCode = input.municipalServiceCode
  if (input.municipalServiceName) body.municipalServiceName = input.municipalServiceName

  const inv = await asaasFetch('/invoices', { method: 'POST', body: JSON.stringify(body) })
  reqStr(inv, 'id', 'createInvoice')
  return inv as AsaasInvoice
}

/** Lista as NFS-e vinculadas a um pagamento. */
export async function getInvoicesByPayment(paymentId: string): Promise<AsaasInvoice[]> {
  const res = (await asaasFetch(`/invoices?payment=${encodeURIComponent(paymentId)}`, { method: 'GET' })) as {
    data?: AsaasInvoice[]
  }
  return Array.isArray(res?.data) ? (res.data as AsaasInvoice[]) : []
}

export async function getInvoice(invoiceId: string): Promise<AsaasInvoice> {
  return (await asaasFetch(`/invoices/${encodeURIComponent(invoiceId)}`, { method: 'GET' })) as AsaasInvoice
}

/** Cancela uma NFS-e emitida/agendada. */
export async function cancelInvoice(invoiceId: string): Promise<AsaasInvoice> {
  return (await asaasFetch(`/invoices/${encodeURIComponent(invoiceId)}/cancel`, { method: 'POST' })) as AsaasInvoice
}

// --- Webhook event types ---

export type AsaasEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_AWAITING_RISK_ANALYSIS'
  | 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
  | 'PAYMENT_ANTICIPATED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_RECEIVED_IN_CASH_UNDONE'
  | 'PAYMENT_CHARGEBACK_REQUESTED'
  | 'PAYMENT_CHARGEBACK_DISPUTE'
  | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  | 'PAYMENT_DUNNING_RECEIVED'
  | 'PAYMENT_DUNNING_REQUESTED'
  | 'PAYMENT_BANK_SLIP_VIEWED'
  | 'PAYMENT_CHECKOUT_VIEWED'

export interface AsaasWebhookPayload {
  event: AsaasEvent
  payment: AsaasPayment
}
