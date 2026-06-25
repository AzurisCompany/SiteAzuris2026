// Queries e helpers de apresentação da área admin (somente leitura).
import { sql, type InscricaoRow } from '@/lib/db'

export const PRODUTO_LABEL: Record<string, string> = {
  'dss-2026': 'DSSBR 2026',
  'lakehouse-comunidade': 'Lakehouse: Pipeline na Prática',
}
export function labelProduto(slug: string): string {
  return PRODUTO_LABEL[slug] ?? slug
}

/** Rótulo curto pras abas da lista de vendas. */
export const PRODUTO_TAB: Record<string, string> = {
  'dss-2026': 'Ingressos DSS',
  'lakehouse-comunidade': 'Curso',
}
export function tabProduto(slug: string): string {
  return PRODUTO_TAB[slug] ?? slug
}

/** Monta link wa.me a partir do telefone gravado (só dígitos, sem DDI).
 *  Prefixa 55 (Brasil) se vier com 10/11 dígitos. Null se não der pra montar. */
export function whatsappUrl(telefone: string | null): string | null {
  if (!telefone) return null
  const d = telefone.replace(/\D/g, '')
  if (d.length < 10) return null
  const comDDI = d.length === 10 || d.length === 11 ? `55${d}` : d
  return `https://wa.me/${comDDI}`
}

export const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
  refunded: 'Estornado',
}
/** Classe de cor (Tailwind) por status, pra badge. */
export const STATUS_COR: Record<string, string> = {
  paid: 'text-[var(--accent-emerald)] bg-[var(--accent-emerald)]/12',
  pending: 'text-amber-300 bg-amber-300/12',
  overdue: 'text-orange-400 bg-orange-400/12',
  cancelled: 'text-[var(--text-muted)] bg-[var(--text-muted)]/12',
  refunded: 'text-red-300 bg-red-300/12',
}

export function brl(centavos: number | null | undefined): string {
  const v = (centavos ?? 0) / 100
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// --- Dashboard ---

export interface ResumoProduto {
  curso_slug: string
  criadas: number
  pagas: number
  pendentes: number
  vencidas: number
  encerradas: number
  bruto_pago_centavos: number
  liquido_pago_centavos: number
  taxa_pago_centavos: number
  pendente_centavos: number
}

export async function resumoFinanceiro(): Promise<ResumoProduto[]> {
  const rows = (await sql`
    SELECT
      curso_slug,
      COUNT(*)                                                      AS criadas,
      COUNT(*) FILTER (WHERE status = 'paid')                       AS pagas,
      COUNT(*) FILTER (WHERE status = 'pending')                    AS pendentes,
      COUNT(*) FILTER (WHERE status = 'overdue')                    AS vencidas,
      COUNT(*) FILTER (WHERE status IN ('cancelled','refunded'))    AS encerradas,
      COALESCE(SUM(valor_centavos)         FILTER (WHERE status = 'paid'), 0)    AS bruto_pago_centavos,
      COALESCE(SUM(valor_liquido_centavos) FILTER (WHERE status = 'paid'), 0)    AS liquido_pago_centavos,
      COALESCE(SUM(taxa_centavos)          FILTER (WHERE status = 'paid'), 0)    AS taxa_pago_centavos,
      COALESCE(SUM(valor_centavos)         FILTER (WHERE status = 'pending'), 0) AS pendente_centavos
    FROM inscricoes
    WHERE NOT is_teste
    GROUP BY curso_slug
    ORDER BY curso_slug
  `) as Array<Record<string, string | number>>

  return rows.map((r) => ({
    curso_slug: String(r.curso_slug),
    criadas: Number(r.criadas),
    pagas: Number(r.pagas),
    pendentes: Number(r.pendentes),
    vencidas: Number(r.vencidas),
    encerradas: Number(r.encerradas),
    bruto_pago_centavos: Number(r.bruto_pago_centavos),
    liquido_pago_centavos: Number(r.liquido_pago_centavos),
    taxa_pago_centavos: Number(r.taxa_pago_centavos),
    pendente_centavos: Number(r.pendente_centavos),
  }))
}

// --- Lista de vendas (com filtros) ---

export interface FiltrosVendas {
  curso?: string
  status?: string
  billing?: string
  busca?: string
  mostrarTeste?: boolean // quando false (padrão), esconde os registros marcados como teste
  limit?: number
  offset?: number
}

export async function listarVendas(f: FiltrosVendas): Promise<{ rows: InscricaoRow[]; total: number }> {
  const cond: string[] = []
  const params: unknown[] = []
  if (!f.mostrarTeste) {
    cond.push(`NOT is_teste`)
  }
  if (f.curso) {
    params.push(f.curso)
    cond.push(`curso_slug = $${params.length}`)
  }
  if (f.status) {
    params.push(f.status)
    cond.push(`status = $${params.length}`)
  }
  if (f.billing) {
    params.push(f.billing)
    cond.push(`billing_type = $${params.length}`)
  }
  if (f.busca && f.busca.trim()) {
    params.push(`%${f.busca.trim()}%`)
    const i = params.length
    cond.push(`(nome ILIKE $${i} OR email ILIKE $${i} OR cpf_cnpj ILIKE $${i})`)
  }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
  const whereParams = [...params]

  const limit = Math.min(Math.max(f.limit ?? 50, 1), 200)
  const offset = Math.max(f.offset ?? 0, 0)
  params.push(limit)
  const lp = params.length
  params.push(offset)
  const op = params.length

  const rows = (await sql.query(
    `SELECT * FROM inscricoes ${where} ORDER BY created_at DESC LIMIT $${lp} OFFSET $${op}`,
    params
  )) as InscricaoRow[]
  const totalRows = (await sql.query(`SELECT COUNT(*) AS c FROM inscricoes ${where}`, whereParams)) as Array<{
    c: string
  }>
  return { rows, total: Number(totalRows[0]?.c ?? 0) }
}

/** Quantos registros estão marcados como teste (pra rótulo do toggle "ver testes"). */
export async function contarTestes(): Promise<number> {
  const rows = (await sql`SELECT COUNT(*) AS c FROM inscricoes WHERE is_teste`) as Array<{ c: string }>
  return Number(rows[0]?.c ?? 0)
}

// --- Detalhe ---

export async function getInscricao(id: number): Promise<InscricaoRow | null> {
  const rows = (await sql`SELECT * FROM inscricoes WHERE id = ${id}`) as InscricaoRow[]
  return rows[0] ?? null
}

export interface EventoAsaas {
  id: number
  event: string
  payload: Record<string, unknown>
  received_at: string
}

export async function getEventos(paymentId: string | null): Promise<EventoAsaas[]> {
  if (!paymentId) return []
  const rows = (await sql`
    SELECT id, event, payload, received_at
    FROM asaas_eventos
    WHERE asaas_payment_id = ${paymentId}
    ORDER BY received_at DESC
  `) as Array<{ id: number; event: string; payload: Record<string, unknown>; received_at: string }>
  return rows.map((r) => ({ id: Number(r.id), event: r.event, payload: r.payload, received_at: r.received_at }))
}
