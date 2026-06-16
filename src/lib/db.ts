// Helper de conexão Postgres (Vercel Postgres / Neon).
// Usado pelas route handlers da inscrição e do webhook do Asaas.

import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

// Inicialização preguiçosa — só conecta na primeira query.
// Necessário pra build não quebrar quando POSTGRES_URL não está disponível
// (Vercel Postgres env vars são "sensitive" e não vêm em vercel env pull).
let _sql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql
  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('POSTGRES_URL/DATABASE_URL não configurada em runtime. Veja Vercel Storage.')
  }
  _sql = neon(connectionString)
  return _sql
}

// Proxy que delega tudo pra getSql(). Permite usar `sql\`...\`` igual antes.
export const sql = new Proxy(((..._args: unknown[]) => {}) as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args: unknown[]) {
    return (getSql() as unknown as (...a: unknown[]) => unknown)(...args)
  },
  get(_target, prop: string) {
    const realSql = getSql() as unknown as Record<string, unknown>
    return realSql[prop]
  },
})

// --- Tipos ---

export type BillingType = 'PIX' | 'CREDIT_CARD'
export type InscricaoStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
export type Lote = 'lote1' | 'lote2' | 'unico'

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
  // --- dados extras do cliente (capturados no checkout) ---
  empresa: string | null
  cargo: string | null
  pessoa_tipo: 'PF' | 'PJ' | null
  razao_social: string | null
  nf_endereco: Record<string, string> | null
  como_conheceu: string | null
  consentimento_lgpd: boolean
  consentimento_em: string | null
  // --- consolidação financeira (Asaas) ---
  valor_liquido_centavos: number | null
  taxa_centavos: number | null
  due_date: string | null
  asaas_status: string | null
  pago_em: string | null
  last_synced_at: string | null
}

// --- Capacidade de lote ---

export const LOTE_CAPACIDADE: Record<'lote1' | 'lote2', number> = {
  lote1: 15,
  lote2: 20,
}

/** Retorna o lote atualmente vendendo (lote1 enquanto tiver vaga; senão lote2). */
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

// --- CRUD ---

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

/** Grava um evento de webhook do Asaas, cru, pra auditoria/histórico. */
export async function registrarEvento(
  asaas_payment_id: string | null,
  event: string,
  payload: unknown
): Promise<void> {
  await sql`
    INSERT INTO asaas_eventos (asaas_payment_id, event, payload)
    VALUES (${asaas_payment_id}, ${event}, ${JSON.stringify(payload)}::jsonb)
  `
}

/** Consolida os dados financeiros vindos do Asaas (sincronização ou webhook). */
export interface ConsolidacaoAsaas {
  status: InscricaoStatus
  asaas_status: string
  valor_liquido_centavos: number | null
  taxa_centavos: number | null
  due_date: string | null
  pago_em: string | null
  paid_at: string | null
}

export async function consolidarAsaas(
  asaas_payment_id: string,
  c: ConsolidacaoAsaas
): Promise<InscricaoRow | null> {
  const rows = (await sql`
    UPDATE inscricoes
       SET status = ${c.status},
           asaas_status = ${c.asaas_status},
           valor_liquido_centavos = ${c.valor_liquido_centavos},
           taxa_centavos = ${c.taxa_centavos},
           due_date = ${c.due_date},
           pago_em = ${c.pago_em},
           paid_at = COALESCE(${c.paid_at}, paid_at),
           last_synced_at = NOW(),
           updated_at = NOW()
     WHERE asaas_payment_id = ${asaas_payment_id}
    RETURNING *
  `) as InscricaoRow[]
  return rows[0] ?? null
}
