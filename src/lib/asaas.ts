// Helper de API do Asaas. Sandbox por padrão (definido por ASAAS_BASE_URL).
// Doc oficial: https://docs.asaas.com/

const BASE_URL = process.env.ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3'
const API_KEY = process.env.ASAAS_API_KEY

if (!API_KEY) {
  // Não jogamos throw aqui pra não quebrar o build — as route handlers checam em runtime.
  console.warn('ASAAS_API_KEY não configurada. Configure via Vercel env vars.')
}

async function asaasFetch(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
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

// --- Customer ---

export interface CreateCustomerInput {
  name: string
  email: string
  cpfCnpj: string
  mobilePhone?: string | null
}

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
  mobilePhone?: string
}

export async function findOrCreateCustomer(input: CreateCustomerInput): Promise<AsaasCustomer> {
  // Procura por CPF/CNPJ primeiro
  const search = await asaasFetch(`/customers?cpfCnpj=${encodeURIComponent(input.cpfCnpj)}`, {
    method: 'GET',
  })
  if (Array.isArray(search?.data) && search.data.length > 0) {
    return search.data[0] as AsaasCustomer
  }

  const created = await asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj,
      mobilePhone: input.mobilePhone ?? undefined,
      notificationDisabled: false,
    }),
  })
  return created as AsaasCustomer
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
  installmentValueReais?: number // só pra CREDIT_CARD (cada parcela)
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
    body.installmentValue = input.installmentValueReais
      ?? Number((input.valueReais / input.installmentCount).toFixed(2))
  } else {
    body.value = input.valueReais
  }

  const payment = await asaasFetch('/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return payment as AsaasPayment
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
  return payment as AsaasPayment
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
  return p as AsaasPaymentDetail
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
  return sub as AsaasSubscription
}

export async function getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return (await asaasFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: 'GET' })) as AsaasSubscription
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
  return inv as AsaasInvoice
}

/** Lista as NFS-e vinculadas a um pagamento. */
export async function getInvoicesByPayment(paymentId: string): Promise<AsaasInvoice[]> {
  const res = await asaasFetch(`/invoices?payment=${encodeURIComponent(paymentId)}`, { method: 'GET' })
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
