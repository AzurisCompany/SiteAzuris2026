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
