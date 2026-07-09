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
  tipo_ingresso: string | null
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
  // --- marcação manual ---
  is_teste: boolean // registro de teste/sandbox: some da lista e dos KPIs por padrão
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

/**
 * Modelo por AUDIENCIA (não por esgotamento):
 * - membro do GU BigData IA / ex-participante do DSSBR → lote1, R$ 550
 * - não-membro → lote2, R$ 750
 */
export type PerfilLakehouse = 'membro' | 'nao-membro'

export const PRECO_POR_PERFIL: Record<
  PerfilLakehouse,
  { lote: 'lote1' | 'lote2'; preco_centavos: number }
> = {
  membro: { lote: 'lote1', preco_centavos: 55000 }, // R$ 550,00
  'nao-membro': { lote: 'lote2', preco_centavos: 75000 }, // R$ 750,00
}

export function normalizarPerfil(v: unknown): PerfilLakehouse {
  return v === 'nao-membro' ? 'nao-membro' : 'membro'
}

/** Retorna lote/preço/vagas pro perfil escolhido (self-declared no checkout). */
export async function determinarLotePorPerfil(perfil: PerfilLakehouse): Promise<{
  lote: Lote
  vagasRestantes: number
  preco_centavos: number
}> {
  const { lote, preco_centavos } = PRECO_POR_PERFIL[perfil]

  const rows = (await sql`
    SELECT lote, reservadas
    FROM v_vagas_por_lote
  `) as Array<{ lote: Lote; reservadas: number }>

  const reservadasMap: Record<string, number> = {}
  for (const r of rows) reservadasMap[r.lote] = Number(r.reservadas)

  const reservadas = reservadasMap[lote] ?? 0
  const capacidade = LOTE_CAPACIDADE[lote as 'lote1' | 'lote2']
  return {
    lote,
    vagasRestantes: Math.max(0, capacidade - reservadas),
    preco_centavos,
  }
}

// --- CRUD ---

export interface NovaInscricaoPendente {
  curso_slug: string
  lote: Lote
  tipo_ingresso?: string | null
  nome: string
  email: string
  cpf_cnpj: string
  telefone: string | null
  billing_type: BillingType
  valor_centavos: number
  installments: number
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  // dados extras
  empresa: string | null
  cargo: string | null
  pessoa_tipo: 'PF' | 'PJ' | null
  razao_social: string | null
  nf_endereco: Record<string, string> | null
  como_conheceu: string | null
  consentimento_lgpd: boolean
  consentimento_em: string | null
}

/**
 * Grava a inscrição como 'pending' ANTES de chamar o Asaas, com todos os dados do
 * cliente. Garante que o lead nunca se perde mesmo se o Asaas falhar depois.
 * Os campos asaas_* ficam nulos até vincularAsaas().
 */
export async function criarInscricaoPendente(i: NovaInscricaoPendente): Promise<InscricaoRow> {
  const rows = (await sql`
    INSERT INTO inscricoes (
      curso_slug, lote, tipo_ingresso, nome, email, cpf_cnpj, telefone,
      billing_type, valor_centavos, installments,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      empresa, cargo, pessoa_tipo, razao_social, nf_endereco, como_conheceu,
      consentimento_lgpd, consentimento_em
    ) VALUES (
      ${i.curso_slug}, ${i.lote}, ${i.tipo_ingresso ?? null}, ${i.nome}, ${i.email}, ${i.cpf_cnpj}, ${i.telefone},
      ${i.billing_type}, ${i.valor_centavos}, ${i.installments},
      ${i.utm_source}, ${i.utm_medium}, ${i.utm_campaign}, ${i.utm_content}, ${i.utm_term},
      ${i.empresa}, ${i.cargo}, ${i.pessoa_tipo}, ${i.razao_social},
      ${i.nf_endereco ? JSON.stringify(i.nf_endereco) : null}::jsonb, ${i.como_conheceu},
      ${i.consentimento_lgpd}, ${i.consentimento_em}
    )
    RETURNING *
  `) as InscricaoRow[]
  return rows[0]
}

/** Vincula os dados do Asaas à inscrição depois que a cobrança foi criada. */
export interface VinculoAsaas {
  asaas_customer_id: string | null
  asaas_payment_id: string | null
  asaas_invoice_url: string | null
  valor_liquido_centavos: number | null
  taxa_centavos: number | null
  due_date: string | null
  asaas_status: string | null
}

export async function vincularAsaas(id: number, v: VinculoAsaas): Promise<void> {
  await sql`
    UPDATE inscricoes
       SET asaas_customer_id = ${v.asaas_customer_id},
           asaas_payment_id = ${v.asaas_payment_id},
           asaas_invoice_url = ${v.asaas_invoice_url},
           valor_liquido_centavos = ${v.valor_liquido_centavos},
           taxa_centavos = ${v.taxa_centavos},
           due_date = ${v.due_date},
           asaas_status = ${v.asaas_status},
           updated_at = NOW()
     WHERE id = ${id}
  `
}

/** Marca uma inscrição pendente como cancelada (ex.: cobrança no Asaas falhou). */
export async function cancelarInscricao(id: number): Promise<void> {
  await sql`UPDATE inscricoes SET status = 'cancelled', updated_at = NOW() WHERE id = ${id}`
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

/** Marca/desmarca uma inscrição como registro de teste (esconde da lista e dos KPIs). */
export async function marcarTeste(id: number, teste: boolean): Promise<InscricaoRow | null> {
  const rows = (await sql`
    UPDATE inscricoes
       SET is_teste = ${teste},
           updated_at = NOW()
     WHERE id = ${id}
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
