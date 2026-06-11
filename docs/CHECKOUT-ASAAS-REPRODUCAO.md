# Checkout de vendas Asaas + Neon — guia de reprodução

> **Objetivo:** reproduzir, em **outro app Next.js**, o sistema de inscrição + pagamento
> que roda em produção no `azuris.com.br` desde 2026-05-25.
>
> Fluxo: **form → cria customer + cobrança no Asaas → grava no Postgres → redireciona pro
> checkout hospedado do Asaas → webhook confirma pagamento → atualiza status no DB.**
>
> Não há captura de cartão no nosso domínio — o Asaas hospeda o checkout (PCI fica com eles).
> Nós só geramos a cobrança e recebemos o `invoiceUrl`.

---

## 0. Arquitetura em 1 minuto

```
┌─────────────┐   POST /api/inscricao   ┌──────────────────────┐
│ InscricaoForm│ ─────────────────────► │ route handler (server)│
│  (client)   │                         │ 1. valida             │
└─────────────┘                         │ 2. determinarLoteAtivo│──► Neon (view)
       ▲                                │ 3. findOrCreateCustomer│──► Asaas API
       │ { invoiceUrl }                 │ 4. createPayment       │──► Asaas API
       │                                │ 5. criarInscricao      │──► Neon (INSERT)
       │                                └──────────┬────────────┘
       │ window.location = invoiceUrl              │ retorna invoiceUrl
       ▼                                           ▼
┌─────────────────────┐                    (status = 'pending')
│ Checkout Asaas (web)│
│  PIX / cartão       │
└──────────┬──────────┘
           │ pagamento confirmado
           ▼
┌──────────────────────────┐  POST /api/webhook/asaas  ┌──────────────┐
│ Asaas dispara webhook     │ ─────────────────────────►│ atualiza DB  │
│ header asaas-access-token │                           │ status='paid'│
└──────────────────────────┘                           └──────────────┘
```

**Componentes:**
- 2 route handlers: `/api/inscricao` (cria cobrança) e `/api/webhook/asaas` (recebe confirmação)
- 2 libs: `lib/asaas.ts` (wrapper HTTP) e `lib/db.ts` (Neon + regra de lotes)
- 1 tabela Postgres + 1 view de vagas
- 1 form client component

**Stack de referência:** Next.js 16 (App Router, route handlers `runtime = 'nodejs'`),
`@neondatabase/serverless`, Asaas API v3. Adaptável a qualquer framework com rotas server-side.

---

## 1. Conta Asaas — o que provisionar

1. Criar conta em **https://www.asaas.com** (produção) e **https://sandbox.asaas.com** (testes).
   São contas/chaves **separadas**.
2. Pegar a **API Key** em: `Configurações → Integrações → API Key`.
   - Sandbox: começa com `$aact_hmlg_...`
   - Produção: começa com `$aact_prod_...`
3. **Base URLs:**
   - Sandbox: `https://sandbox.asaas.com/api/v3`
   - Produção: `https://www.asaas.com/api/v3`
4. Autenticação: header **`access_token: <API_KEY>`** (não é Bearer). Content-Type JSON.
5. Doc oficial: https://docs.asaas.com/

### Sanity check da chave (rode antes de qualquer coisa)

```bash
curl -s https://www.asaas.com/api/v3/myAccount \
  -H "access_token: $ASAAS_API_KEY" | head -c 400
# Deve retornar dados da conta. 401 = chave errada/ambiente errado.
```

> **Gotcha:** `canReceiveTransfer:false` no `/myAccount` é sobre **saque pra conta bancária**,
> NÃO impede receber pagamentos. Ignore pra fins de checkout.

---

## 2. Variáveis de ambiente

| Var | Exemplo | Onde |
|---|---|---|
| `ASAAS_API_KEY` | `$aact_prod_...` | Vercel env (sensitive) |
| `ASAAS_BASE_URL` | `https://www.asaas.com/api/v3` | Vercel env |
| `ASAAS_WEBHOOK_TOKEN` | 32 hex chars | Vercel env + painel Asaas |
| `POSTGRES_URL` ou `DATABASE_URL` | `postgresql://...` (Neon) | Vercel Storage |

Gerar o webhook token:
```bash
openssl rand -hex 16   # 32 hex chars
```

Setar na Vercel:
```bash
vercel env add ASAAS_API_KEY production
vercel env add ASAAS_BASE_URL production       # https://www.asaas.com/api/v3
vercel env add ASAAS_WEBHOOK_TOKEN production
```

`.env.local` pra dev (aponte pro **sandbox** em dev):
```bash
ASAAS_API_KEY=$aact_hmlg_...
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=<mesmo token do painel sandbox>
POSTGRES_URL=postgresql://...
```

> **Gotcha Vercel:** envs marcadas "sensitive" (todas `ASAAS_*` e `POSTGRES_*`) baixam como
> string vazia `""` em `vercel env pull`. Funcionam em runtime, mas scripts locais precisam
> dos valores recriados à mão. Pra consultar o DB, use o **Neon Console**
> (Vercel → Storage → Open in Neon → SQL Editor).

---

## 3. Banco — schema Postgres (Neon)

`sql/inscricoes-schema.sql` (idempotente, roda quantas vezes quiser):

```sql
-- Schema da tabela de inscricoes
CREATE TABLE IF NOT EXISTS inscricoes (
  id                SERIAL PRIMARY KEY,
  curso_slug        TEXT NOT NULL,                  -- identifica o produto
  lote              TEXT NOT NULL,                  -- 'lote1' | 'lote2'

  -- dados do aluno
  nome              TEXT NOT NULL,
  email             TEXT NOT NULL,
  cpf_cnpj          TEXT NOT NULL,                  -- só dígitos (sem máscara)
  telefone          TEXT,

  -- dados do pagamento
  billing_type      TEXT NOT NULL,                  -- 'PIX' | 'CREDIT_CARD'
  valor_centavos    INTEGER NOT NULL,               -- valor cobrado (já com desconto se PIX)
  installments      INTEGER NOT NULL DEFAULT 1,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending|paid|overdue|cancelled|refunded

  -- referência Asaas
  asaas_customer_id TEXT,
  asaas_payment_id  TEXT UNIQUE,                    -- UNIQUE = idempotência do webhook
  asaas_invoice_url TEXT,

  -- tracking
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,
  utm_content       TEXT,
  utm_term          TEXT,

  -- timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inscricoes_email ON inscricoes(email);
CREATE INDEX IF NOT EXISTS idx_inscricoes_status ON inscricoes(status);
CREATE INDEX IF NOT EXISTS idx_inscricoes_lote_status ON inscricoes(lote, status);

-- View auxiliar: conta vagas reservadas (pagas + pendentes) por lote
CREATE OR REPLACE VIEW v_vagas_por_lote AS
SELECT
  lote,
  COUNT(*) FILTER (WHERE status = 'paid')                AS pagas,
  COUNT(*) FILTER (WHERE status = 'pending')             AS pendentes,
  COUNT(*) FILTER (WHERE status IN ('paid','pending'))   AS reservadas
FROM inscricoes
WHERE curso_slug = 'lakehouse-comunidade'   -- AJUSTE pro seu produto
GROUP BY lote;
```

Rodar o schema (Node script `sql/run-schema.mjs`):
```js
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'

const sql = neon(process.env.POSTGRES_URL)
const ddl = readFileSync('./sql/inscricoes-schema.sql', 'utf8')
// neon() não roda multi-statement num call só; split por ';' e roda um a um
for (const stmt of ddl.split(';').map(s => s.trim()).filter(Boolean)) {
  await sql.query(stmt)
  console.log('OK:', stmt.slice(0, 60).replace(/\n/g, ' '))
}
console.log('Schema aplicado.')
```
```bash
POSTGRES_URL='postgresql://...' node sql/run-schema.mjs
```
Ou cole o SQL direto no **Neon Console → SQL Editor**.

---

## 4. Código — copie estes 5 arquivos

### 4.1 `src/lib/asaas.ts` — wrapper da API Asaas

```ts
// Helper de API do Asaas. Sandbox por padrão (definido por ASAAS_BASE_URL).
// Doc oficial: https://docs.asaas.com/

const BASE_URL = process.env.ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3'
const API_KEY = process.env.ASAAS_API_KEY

if (!API_KEY) {
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
  // Procura por CPF/CNPJ primeiro (evita duplicar customer)
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
```

### 4.2 `src/lib/db.ts` — Neon + regra de lotes

```ts
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

// Inicialização preguiçosa — só conecta na primeira query (build não quebra sem env).
let _sql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql
  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('POSTGRES_URL/DATABASE_URL não configurada em runtime.')
  }
  _sql = neon(connectionString)
  return _sql
}

// Proxy que delega tudo pra getSql(). Permite usar sql`...` igual antes.
export const sql = new Proxy(((..._args: unknown[]) => {}) as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args: unknown[]) {
    return (getSql() as unknown as (...a: unknown[]) => unknown)(...args)
  },
  get(_target, prop: string) {
    const realSql = getSql() as unknown as Record<string, unknown>
    return realSql[prop]
  },
})

export type BillingType = 'PIX' | 'CREDIT_CARD'
export type InscricaoStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
export type Lote = 'lote1' | 'lote2'

export interface InscricaoRow {
  id: number
  curso_slug: string
  lote: Lote
  nome: string
  email: string
  cpf_cnpj: string
  telefone: string | null
  billing_type: BillingType
  valor_centavos: number
  installments: number
  status: InscricaoStatus
  asaas_customer_id: string | null
  asaas_payment_id: string | null
  asaas_invoice_url: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  created_at: string
  updated_at: string
  paid_at: string | null
}

// --- Capacidade de lote (AJUSTE pros seus números) ---

export const LOTE_CAPACIDADE: Record<Lote, number> = {
  lote1: 15,
  lote2: 20,
}

/** Retorna o lote vendendo (lote1 enquanto tiver vaga; senão lote2). */
export async function determinarLoteAtivo(): Promise<{
  lote: Lote
  vagasRestantes: number
  preco_centavos: number
}> {
  const rows = (await sql`
    SELECT lote, reservadas
    FROM v_vagas_por_lote
  `) as Array<{ lote: Lote; reservadas: number }>

  const reservadasMap: Record<string, number> = {}
  for (const r of rows) reservadasMap[r.lote] = Number(r.reservadas)

  const reservadasLote1 = reservadasMap.lote1 ?? 0
  if (reservadasLote1 < LOTE_CAPACIDADE.lote1) {
    return {
      lote: 'lote1',
      vagasRestantes: LOTE_CAPACIDADE.lote1 - reservadasLote1,
      preco_centavos: 55000, // R$ 550,00
    }
  }

  const reservadasLote2 = reservadasMap.lote2 ?? 0
  return {
    lote: 'lote2',
    vagasRestantes: Math.max(0, LOTE_CAPACIDADE.lote2 - reservadasLote2),
    preco_centavos: 75000, // R$ 750,00
  }
}

export interface NovaInscricao {
  curso_slug: string
  lote: Lote
  nome: string
  email: string
  cpf_cnpj: string
  telefone: string | null
  billing_type: BillingType
  valor_centavos: number
  installments: number
  asaas_customer_id: string | null
  asaas_payment_id: string | null
  asaas_invoice_url: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
}

export async function criarInscricao(input: NovaInscricao): Promise<InscricaoRow> {
  const rows = (await sql`
    INSERT INTO inscricoes (
      curso_slug, lote, nome, email, cpf_cnpj, telefone,
      billing_type, valor_centavos, installments,
      asaas_customer_id, asaas_payment_id, asaas_invoice_url,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term
    ) VALUES (
      ${input.curso_slug}, ${input.lote}, ${input.nome}, ${input.email}, ${input.cpf_cnpj}, ${input.telefone},
      ${input.billing_type}, ${input.valor_centavos}, ${input.installments},
      ${input.asaas_customer_id}, ${input.asaas_payment_id}, ${input.asaas_invoice_url},
      ${input.utm_source}, ${input.utm_medium}, ${input.utm_campaign}, ${input.utm_content}, ${input.utm_term}
    )
    RETURNING *
  `) as InscricaoRow[]
  return rows[0]
}

export async function atualizarStatusPorAsaasId(
  asaas_payment_id: string,
  status: InscricaoStatus,
  paid_at: string | null
): Promise<InscricaoRow | null> {
  const rows = (await sql`
    UPDATE inscricoes
       SET status = ${status},
           paid_at = ${paid_at},
           updated_at = NOW()
     WHERE asaas_payment_id = ${asaas_payment_id}
    RETURNING *
  `) as InscricaoRow[]
  return rows[0] ?? null
}
```

### 4.3 `src/app/api/inscricao/route.ts` — cria cobrança

```ts
// POST /api/inscricao
// Recebe dados do form, valida, cria customer + payment no Asaas, salva no DB.
// Retorna { invoiceUrl } pra o cliente redirecionar pro checkout.

import { NextResponse } from 'next/server'
import { criarInscricao, determinarLoteAtivo, type BillingType } from '@/lib/db'
import { createPayment, findOrCreateCustomer } from '@/lib/asaas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RequestBody {
  nome: string
  email: string
  cpf_cnpj: string
  telefone?: string
  billing_type: BillingType
  installments?: number
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string }
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, '')
}

function todayPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function validate(body: RequestBody): string | null {
  if (!body.nome || body.nome.trim().length < 3) return 'Nome inválido'
  if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) return 'E-mail inválido'
  const cpf = onlyDigits(body.cpf_cnpj ?? '')
  if (cpf.length !== 11 && cpf.length !== 14) return 'CPF/CNPJ inválido (precisa 11 ou 14 dígitos)'
  if (body.billing_type !== 'PIX' && body.billing_type !== 'CREDIT_CARD') return 'Forma de pagamento inválida'
  if (body.billing_type === 'CREDIT_CARD') {
    const n = body.installments ?? 1
    if (!Number.isInteger(n) || n < 1 || n > 12) return 'Parcelamento inválido (1 a 12)'
  }
  return null
}

export async function POST(request: Request) {
  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const error = validate(body)
  if (error) return NextResponse.json({ error }, { status: 400 })

  // Descobre lote ativo + preço base (NUNCA confie em preço vindo do client)
  const { lote, vagasRestantes, preco_centavos: precoBaseCentavos } = await determinarLoteAtivo()
  if (vagasRestantes <= 0) {
    return NextResponse.json(
      { error: 'Não há mais vagas neste momento. Entre em contato pra fila de espera.' },
      { status: 409 }
    )
  }

  // PIX: 5% off. Cartão: valor cheio, parcelado sem juros.
  const installments = body.billing_type === 'CREDIT_CARD' ? body.installments ?? 1 : 1
  const valorCobradoCentavos =
    body.billing_type === 'PIX' ? Math.round(precoBaseCentavos * 0.95) : precoBaseCentavos
  const valorCobradoReais = valorCobradoCentavos / 100
  const installmentValueReais =
    installments > 1 ? Number((valorCobradoReais / installments).toFixed(2)) : valorCobradoReais

  // Cria/recupera customer no Asaas
  let customer
  try {
    customer = await findOrCreateCustomer({
      name: body.nome.trim(),
      email: body.email.trim().toLowerCase(),
      cpfCnpj: onlyDigits(body.cpf_cnpj),
      mobilePhone: body.telefone ? onlyDigits(body.telefone) : null,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return NextResponse.json({ error: `Falha ao criar cliente: ${msg}` }, { status: 502 })
  }

  // Cria cobrança no Asaas
  let payment
  try {
    payment = await createPayment({
      customerId: customer.id,
      billingType: body.billing_type,
      valueReais: valorCobradoReais,
      description: `Lakehouse: Pipeline na Prática — ${lote === 'lote1' ? 'Lote 1' : 'Lote 2'}`,
      externalReference: `lakehouse-comunidade:${lote}`,
      dueDate: todayPlusDays(3),
      installmentCount: installments > 1 ? installments : undefined,
      installmentValueReais: installments > 1 ? installmentValueReais : undefined,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return NextResponse.json({ error: `Falha ao criar cobrança: ${msg}` }, { status: 502 })
  }

  // Salva inscrição no DB (status 'pending' default)
  try {
    await criarInscricao({
      curso_slug: 'lakehouse-comunidade',
      lote,
      nome: body.nome.trim(),
      email: body.email.trim().toLowerCase(),
      cpf_cnpj: onlyDigits(body.cpf_cnpj),
      telefone: body.telefone ? onlyDigits(body.telefone) : null,
      billing_type: body.billing_type,
      valor_centavos: valorCobradoCentavos,
      installments,
      asaas_customer_id: customer.id,
      asaas_payment_id: payment.id,
      asaas_invoice_url: payment.invoiceUrl,
      utm_source: body.utm?.source ?? null,
      utm_medium: body.utm?.medium ?? null,
      utm_campaign: body.utm?.campaign ?? null,
      utm_content: body.utm?.content ?? null,
      utm_term: body.utm?.term ?? null,
    })
  } catch (e) {
    // Asaas já criou — não desfazemos. Webhook ainda vai atualizar quando pagar.
    console.error('Falha ao salvar inscrição no DB (cobrança Asaas criada):', e)
  }

  return NextResponse.json({
    ok: true,
    invoiceUrl: payment.invoiceUrl,
    paymentId: payment.id,
    valor: valorCobradoReais,
    lote,
  })
}
```

### 4.4 `src/app/api/webhook/asaas/route.ts` — recebe confirmação

```ts
// POST /api/webhook/asaas
// Recebe notificações do Asaas e atualiza o status da inscrição no DB.
// Configurar no painel Asaas: Integrações → Notificações → Webhooks
//   URL:   https://SEU-DOMINIO/api/webhook/asaas
//   Token: valor de ASAAS_WEBHOOK_TOKEN (chega no header asaas-access-token)

import { NextResponse } from 'next/server'
import { atualizarStatusPorAsaasId, type InscricaoStatus } from '@/lib/db'
import type { AsaasEvent, AsaasWebhookPayload } from '@/lib/asaas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN

const EVENT_TO_STATUS: Partial<Record<AsaasEvent, InscricaoStatus>> = {
  PAYMENT_CONFIRMED: 'paid',          // cartão: autorização+captura
  PAYMENT_RECEIVED: 'paid',           // PIX/boleto: banco confirmou
  PAYMENT_OVERDUE: 'overdue',
  PAYMENT_DELETED: 'cancelled',       // libera vaga
  PAYMENT_REFUNDED: 'refunded',       // libera vaga
  PAYMENT_CHARGEBACK_REQUESTED: 'refunded',
}

export async function POST(request: Request) {
  // Valida token (header asaas-access-token)
  const token = request.headers.get('asaas-access-token')
  if (!WEBHOOK_TOKEN) {
    console.error('ASAAS_WEBHOOK_TOKEN não configurado')
    return NextResponse.json({ error: 'webhook não configurado' }, { status: 500 })
  }
  if (token !== WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'token inválido' }, { status: 401 })
  }

  let payload: AsaasWebhookPayload
  try {
    payload = (await request.json()) as AsaasWebhookPayload
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const event = payload.event
  const paymentId = payload.payment?.id
  if (!event || !paymentId) {
    return NextResponse.json({ error: 'payload incompleto' }, { status: 400 })
  }

  const newStatus = EVENT_TO_STATUS[event]
  if (!newStatus) {
    // Eventos sem ação (PAYMENT_CREATED, PAYMENT_UPDATED, etc.)
    // Asaas espera 200 OK pra não reenviar.
    console.log(`Webhook Asaas: evento ${event} pra payment ${paymentId} (sem ação)`)
    return NextResponse.json({ ok: true, action: 'noop' })
  }

  const paidAt = newStatus === 'paid' ? new Date().toISOString() : null
  const row = await atualizarStatusPorAsaasId(paymentId, newStatus, paidAt)

  if (!row) {
    // Webhook pode chegar antes da inserção (raro). Logamos e devolvemos 200.
    console.warn(`Webhook Asaas: payment ${paymentId} não encontrado no DB`)
    return NextResponse.json({ ok: true, action: 'not_found' })
  }

  console.log(`Webhook Asaas: ${event} → inscricao ${row.id} (${row.email}) status=${newStatus}`)
  return NextResponse.json({ ok: true, action: 'updated', inscricaoId: row.id })
}
```

### 4.5 `InscricaoForm.tsx` — form client (essencial)

O form completo está no repo original; o que importa pra reprodução é o `onSubmit`:
captura UTM da URL, faz POST, redireciona pro `invoiceUrl`. Máscaras de CPF/telefone são UX.

```tsx
'use client'
import { useState, useEffect, type FormEvent } from 'react'

type BillingType = 'PIX' | 'CREDIT_CARD'

export default function InscricaoForm({ precoBaseReais, precoPixReais }: {
  precoBaseReais: number; precoPixReais: number
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [billingType, setBillingType] = useState<BillingType>('PIX')
  const [installments, setInstallments] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [utm, setUtm] = useState<Record<string, string | undefined>>({})

  // Captura UTM da URL pra atribuição
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setUtm({
      source: p.get('utm_source') ?? undefined,
      medium: p.get('utm_medium') ?? undefined,
      campaign: p.get('utm_campaign') ?? undefined,
      content: p.get('utm_content') ?? undefined,
      term: p.get('utm_term') ?? undefined,
    })
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null); setSubmitting(true)
    try {
      const res = await fetch('/api/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
          telefone: telefone.replace(/\D/g, ''),
          billing_type: billingType,
          installments: billingType === 'CREDIT_CARD' ? installments : 1,
          utm,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data?.error ?? 'Falha.'); setSubmitting(false); return }
      if (data.invoiceUrl) {
        // (opcional) dispara begin_checkout no GA antes do redirect — ver §7
        window.location.href = data.invoiceUrl   // → checkout hospedado Asaas
      }
    } catch {
      setErro('Erro de rede.'); setSubmitting(false)
    }
  }
  // ...resto do JSX (inputs + radios PIX/cartão + select de parcelas)
}
```

A página server passa os preços calculados (lê `determinarLoteAtivo()`) pro form:
```tsx
// src/app/.../inscricao/page.tsx (Server Component)
const { preco_centavos } = await determinarLoteAtivo()
const precoBaseReais = preco_centavos / 100
const precoPixReais = Math.round(preco_centavos * 0.95) / 100
return <InscricaoForm precoBaseReais={precoBaseReais} precoPixReais={precoPixReais} />
```

---

## 5. Configurar o webhook no painel Asaas

Em **AMBOS** sandbox e produção (`Integrações → Notificações → Webhooks → Adicionar`):

| Campo | Valor |
|---|---|
| URL | `https://SEU-DOMINIO/api/webhook/asaas` |
| Token de autenticação | mesmo valor de `ASAAS_WEBHOOK_TOKEN` |
| Versão da API | v3 |
| Envio | não sequencial / fila sincronizada |
| Eventos | `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED` |

O token configurado aqui chega no header **`asaas-access-token`** de cada POST. O handler compara
e rejeita 401 se não bater.

---

## 6. Testar (fluxo de validação real usado em prod)

### Dev local — expor webhook
O Asaas precisa de URL pública pra chamar o webhook. Em dev:
```bash
# túnel (ex.: cloudflared ou ngrok) apontando pro localhost:3000
cloudflared tunnel --url http://localhost:3000
# use a URL pública /api/webhook/asaas no painel sandbox do Asaas
```

### Disparar uma cobrança
```bash
curl -s -X POST http://localhost:3000/api/inscricao \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Fulano Teste","email":"teste@ex.com","cpf_cnpj":"12345678909","telefone":"41999999999","billing_type":"PIX"}'
# → { "invoiceUrl": "https://sandbox.asaas.com/i/...", "paymentId": "pay_..." }
```
Abra o `invoiceUrl` e pague (sandbox simula). O webhook deve chegar em segundos.

### Matriz validada em produção (2026-05-25)
| Método | Valor | Webhook | Latência |
|---|---:|---|---|
| PIX | R$ 9,50 | `PAYMENT_RECEIVED` | ~7s |
| Cartão VISA 1x | R$ 10,00 | `PAYMENT_CONFIRMED` | ~6s |

> Cartão dispara só `PAYMENT_CONFIRMED` (autorização+captura num passo).
> PIX dispara `PAYMENT_RECEIVED` quando o banco confirma.

### Logs em runtime (Vercel)
```bash
vercel logs https://SEU-DOMINIO --follow | grep -E "Webhook|inscricao|asaas"
# Log do handler: "Webhook Asaas: <EVENT> → inscricao <ID> (<email>) status=<status>"
```

### Consultar DB
Envs sensitive não vêm em `vercel env pull` → use **Neon Console → SQL Editor**:
```sql
SELECT id, nome, email, billing_type, valor_centavos, status, created_at, paid_at
FROM inscricoes ORDER BY id DESC LIMIT 20;

SELECT * FROM v_vagas_por_lote;   -- vagas reservadas por lote
```

---

## 7. (Opcional) Tracking GA4 — begin_checkout

Helper `src/lib/gtag.ts`:
```ts
declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}
export function gaEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  // transport_type beacon garante envio durante o redirect pro checkout
  window.gtag('event', name, { transport_type: 'beacon', ...params })
}
```
No `onSubmit`, antes do redirect:
```ts
gaEvent('begin_checkout', {
  currency: 'BRL', value: valorCobradoReais, payment_type: billingType,
  items: [{ item_id: 'produto', item_name: 'Nome', price: valorCobradoReais, quantity: 1 }],
})
```

> **`purchase` NÃO está implementado.** A página `/obrigado` aparece antes do PIX ser pago —
> disparar `purchase` no client inflaria a conversão. Caminho certo (futuro): **GA4 Measurement
> Protocol no webhook** quando `PAYMENT_RECEIVED/CONFIRMED`, mandando `purchase` server-side com o
> `client_id` real (capturar cookie `_ga` no form e salvar na inscrição). Precisa do `api_secret`
> em GA4 Admin → Data Streams → Measurement Protocol.

---

## 8. Regras de negócio (ajuste pro seu produto)

- **Lote 1:** 15 vagas a R$ 550 · **Lote 2:** 20 vagas a R$ 750 (ativa quando lote 1 esgota).
- **PIX:** 5% off, vencimento +3 dias. **Cartão:** valor cheio, até 12x sem juros.
- **"Esgotado"** considera `status IN ('paid','pending')` — vaga só libera quando o webhook
  marca `cancelled`/`overdue`/`refunded`.
- **Preço é sempre decidido no servidor** (`determinarLoteAtivo`), nunca confie no client.

---

## 9. Gotchas que vão te morder (lições de prod)

1. **Header de auth do Asaas é `access_token`, não `Authorization: Bearer`.**
2. **Webhook valida via header `asaas-access-token`** = valor do token configurado no painel.
   Sempre responda **200** mesmo em noop/not_found, senão o Asaas reenvia em loop.
3. **Idempotência:** `asaas_payment_id` é UNIQUE. Reentrega do mesmo evento = mesmo UPDATE,
   sem efeito colateral. O Asaas reenvia agressivamente.
4. **Cartão parcelado:** mandar `installmentCount` + `installmentValue` (SEM `value`).
   PIX/boleto: mandar `value`. Misturar dá erro 400.
5. **PIX tem valor cravado no QR.** Pra testar mais barato, **cancele** a cobrança e gere outra
   (não dá pra alterar valor). Cancelar no painel dispara `PAYMENT_DELETED` → DB vira `cancelled`.
6. **Valor mínimo PIX no Asaas:** R$ 1,00.
7. **Envs sensitive na Vercel** (`ASAAS_*`, `POSTGRES_*`) baixam vazias em `vercel env pull`.
   Funcionam em runtime; pra scripts locais, recrie à mão.
8. **`neon()` não roda multi-statement** num único call — separe o DDL por `;`.
9. **Conta sandbox ≠ produção:** chaves, customers e webhooks são mundos separados. Configure o
   webhook nos dois painéis.

---

## 10. Checklist de reprodução

- [ ] Contas Asaas (sandbox + prod) criadas, API keys em mãos
- [ ] Banco Neon provisionado, `POSTGRES_URL` em mãos
- [ ] `inscricoes-schema.sql` aplicado (tabela + view)
- [ ] `npm i @neondatabase/serverless`
- [ ] 5 arquivos copiados (asaas.ts, db.ts, 2 routes, form) + ajustados (`curso_slug`, preços, lotes)
- [ ] Env vars setadas (`ASAAS_API_KEY`, `ASAAS_BASE_URL`, `ASAAS_WEBHOOK_TOKEN`, `POSTGRES_URL`)
- [ ] Webhook configurado nos 2 painéis Asaas (URL + token + 6 eventos)
- [ ] Teste sandbox: POST /api/inscricao → pagar → webhook → status vira `paid` no DB
- [ ] Cutover pra produção: trocar `ASAAS_BASE_URL` + `ASAAS_API_KEY` pros valores de prod

---

*Gerado a partir do código em produção de `azuris.com.br/web` em 2026-06-03. Fonte da verdade:
os arquivos reais no repo original — este doc reflete o estado naquela data.*
