// Queries e helpers de apresentação da área admin (somente leitura).
import { sql, type InscricaoRow } from '@/lib/db'

export const PRODUTO_LABEL: Record<string, string> = {
  'dss-2026': 'DSSBR 2026',
  'lakehouse-comunidade': 'Lakehouse: Pipeline na Prática',
  proposta: 'Proposta customizada',
  assinatura: 'Assinatura',
}
export function labelProduto(slug: string): string {
  return PRODUTO_LABEL[slug] ?? slug
}

/** Rótulo curto pras abas da lista de vendas. */
export const PRODUTO_TAB: Record<string, string> = {
  'dss-2026': 'Ingressos DSS',
  'lakehouse-comunidade': 'Curso',
  proposta: 'Propostas',
  assinatura: 'Assinaturas',
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

// --- Breakdown por tipo de ingresso (variante do produto) ---

export interface ResumoTipo {
  curso_slug: string
  tipo_ingresso: string | null
  criadas: number
  pagas: number
  bruto_pago_centavos: number
  liquido_pago_centavos: number
}

/** Rótulos amigáveis pra tipos conhecidos (o resto cai no fallback capitalizado). */
const TIPO_LABEL: Record<string, string> = {
  membro: 'Membro (GU/DSSBR)',
  'nao-membro': 'Não-membro',
}
/** Rótulo de exibição de um tipo de ingresso. NULL vira "— sem tipo". */
export function labelTipo(tipo: string | null): string {
  if (!tipo) return '— sem tipo'
  if (TIPO_LABEL[tipo]) return TIPO_LABEL[tipo]
  return tipo.charAt(0).toUpperCase() + tipo.slice(1)
}

/** Vendas agrupadas por produto + tipo de ingresso, pra abrir os cards do dashboard. */
export async function resumoPorTipo(): Promise<ResumoTipo[]> {
  const rows = (await sql`
    SELECT
      curso_slug,
      tipo_ingresso,
      COUNT(*)                                                                   AS criadas,
      COUNT(*) FILTER (WHERE status = 'paid')                                    AS pagas,
      COALESCE(SUM(valor_centavos)         FILTER (WHERE status = 'paid'), 0)     AS bruto_pago_centavos,
      COALESCE(SUM(valor_liquido_centavos) FILTER (WHERE status = 'paid'), 0)     AS liquido_pago_centavos
    FROM inscricoes
    WHERE NOT is_teste
    GROUP BY curso_slug, tipo_ingresso
    ORDER BY curso_slug, tipo_ingresso NULLS FIRST
  `) as Array<Record<string, string | number | null>>

  return rows.map((r) => ({
    curso_slug: String(r.curso_slug),
    tipo_ingresso: r.tipo_ingresso == null ? null : String(r.tipo_ingresso),
    criadas: Number(r.criadas),
    pagas: Number(r.pagas),
    bruto_pago_centavos: Number(r.bruto_pago_centavos),
    liquido_pago_centavos: Number(r.liquido_pago_centavos),
  }))
}

// --- Visão financeira: recebíveis, série temporal e faturamento mensal ---

export interface RecebivelBucket {
  bucket: 'vencido' | 'hoje' | '7d' | '30d' | 'depois' | 'sem_venc'
  qtde: number
  bruto: number
  liquido: number
}

/** Recebíveis (pendentes/vencidos) agrupados por janela de vencimento. Forward-looking. */
export async function recebiveisPorVencimento(): Promise<RecebivelBucket[]> {
  const rows = (await sql`
    SELECT
      CASE
        WHEN due_date IS NULL              THEN 'sem_venc'
        WHEN due_date < CURRENT_DATE       THEN 'vencido'
        WHEN due_date = CURRENT_DATE       THEN 'hoje'
        WHEN due_date <= CURRENT_DATE + 7  THEN '7d'
        WHEN due_date <= CURRENT_DATE + 30 THEN '30d'
        ELSE 'depois'
      END AS bucket,
      COUNT(*)                                                       AS qtde,
      COALESCE(SUM(valor_centavos), 0)                              AS bruto,
      COALESCE(SUM(COALESCE(valor_liquido_centavos, valor_centavos)), 0) AS liquido
    FROM inscricoes
    WHERE status IN ('pending','overdue') AND NOT is_teste
    GROUP BY bucket
  `) as Array<Record<string, string>>
  return rows.map((r) => ({
    bucket: r.bucket as RecebivelBucket['bucket'],
    qtde: Number(r.qtde),
    bruto: Number(r.bruto),
    liquido: Number(r.liquido),
  }))
}

export interface VendaDia {
  dia: string // YYYY-MM-DD
  qtde: number
  bruto: number
}

/** Vendas PAGAS por dia (por data de pagamento) nos últimos N dias. Série pro gráfico. */
export async function vendasPorDia(dias = 30): Promise<VendaDia[]> {
  const rows = (await sql`
    SELECT to_char(date_trunc('day', COALESCE(pago_em, paid_at)), 'YYYY-MM-DD') AS dia,
           COUNT(*)                          AS qtde,
           COALESCE(SUM(valor_centavos), 0)  AS bruto
      FROM inscricoes
     WHERE status = 'paid' AND NOT is_teste
       AND COALESCE(pago_em, paid_at) >= NOW() - make_interval(days => ${dias})
     GROUP BY dia
     ORDER BY dia
  `) as Array<Record<string, string>>
  return rows.map((r) => ({ dia: String(r.dia), qtde: Number(r.qtde), bruto: Number(r.bruto) }))
}

export interface FaturamentoMes {
  mes: string // YYYY-MM
  qtde: number
  bruto: number
  liquido: number
  taxa: number
}

/** Faturamento PAGO por mês de competência (data de pagamento), últimos N meses. */
export async function faturamentoMensal(meses = 12): Promise<FaturamentoMes[]> {
  const rows = (await sql`
    SELECT to_char(date_trunc('month', COALESCE(pago_em, paid_at)), 'YYYY-MM') AS mes,
           COUNT(*)                                                            AS qtde,
           COALESCE(SUM(valor_centavos), 0)                                    AS bruto,
           COALESCE(SUM(COALESCE(valor_liquido_centavos, valor_centavos)), 0)  AS liquido,
           COALESCE(SUM(taxa_centavos), 0)                                     AS taxa
      FROM inscricoes
     WHERE status = 'paid' AND NOT is_teste AND COALESCE(pago_em, paid_at) IS NOT NULL
     GROUP BY mes
     ORDER BY mes DESC
     LIMIT ${meses}
  `) as Array<Record<string, string>>
  return rows.map((r) => ({
    mes: String(r.mes),
    qtde: Number(r.qtde),
    bruto: Number(r.bruto),
    liquido: Number(r.liquido),
    taxa: Number(r.taxa),
  }))
}

/** Valores distintos pra popular os selects de filtro (tipos + origens de tráfego). */
export async function opcoesFiltro(): Promise<{ tipos: string[]; origens: string[] }> {
  const [tiposRows, origensRows] = await Promise.all([
    sql`SELECT DISTINCT tipo_ingresso FROM inscricoes WHERE tipo_ingresso IS NOT NULL ORDER BY tipo_ingresso`,
    sql`SELECT DISTINCT utm_source FROM inscricoes WHERE utm_source IS NOT NULL AND utm_source <> '' ORDER BY utm_source`,
  ])
  return {
    tipos: (tiposRows as Array<{ tipo_ingresso: string }>).map((r) => r.tipo_ingresso),
    origens: (origensRows as Array<{ utm_source: string }>).map((r) => r.utm_source),
  }
}

// --- Lista de vendas (com filtros) ---

export interface FiltrosVendas {
  curso?: string
  status?: string
  billing?: string
  tipo?: string
  pessoa?: string // 'PF' | 'PJ'
  origem?: string // utm_source
  de?: string // data inicial (YYYY-MM-DD), inclusive
  ate?: string // data final (YYYY-MM-DD), inclusive
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
  if (f.tipo) {
    params.push(f.tipo)
    cond.push(`tipo_ingresso = $${params.length}`)
  }
  if (f.pessoa) {
    params.push(f.pessoa)
    cond.push(`pessoa_tipo = $${params.length}`)
  }
  if (f.origem) {
    params.push(f.origem)
    cond.push(`utm_source = $${params.length}`)
  }
  if (f.de) {
    params.push(f.de)
    cond.push(`created_at >= $${params.length}::date`)
  }
  if (f.ate) {
    params.push(f.ate)
    // inclusive: até o fim do dia informado
    cond.push(`created_at < ($${params.length}::date + INTERVAL '1 day')`)
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

// --- Painel de saúde / reconciliação ---

export interface DuplicataGrupo {
  cpf_cnpj: string
  curso_slug: string
  valor_centavos: number
  qtde: number
}
export interface EventoOrfao {
  asaas_payment_id: string
  eventos: number
  ultimo: string
}
export interface DiagnosticoSaude {
  pendentesVencidos: { rows: InscricaoRow[]; total: number }
  semCobranca: { rows: InscricaoRow[]; total: number }
  pendentesAntigos: { rows: InscricaoRow[]; total: number }
  possiveisDuplicatas: { rows: DuplicataGrupo[]; total: number }
  eventosOrfaos: { rows: EventoOrfao[]; total: number }
  ultimaConciliacao: string | null
}

/** Extrai total (COUNT(*) OVER()) + linhas de um resultado com coluna _total. */
function comTotal<T>(raw: Array<T & { _total?: string | number }>): { rows: T[]; total: number } {
  const total = raw.length > 0 ? Number(raw[0]._total ?? raw.length) : 0
  const rows = raw.map((r) => {
    const { _total: _omit, ...rest } = r as T & { _total?: unknown }
    return rest as T
  })
  return { rows, total }
}

/**
 * Diagnóstico read-only pra detectar furos de reconciliação:
 * - pendentes já vencidos (webhook provavelmente perdido → sincronizar)
 * - inscrições sem cobrança gerada (asaas_payment_id nulo, não canceladas)
 * - pendentes arrastando há +7 dias
 * - possíveis duplicatas (mesmo doc/produto/valor, 2+ linhas vivas)
 * - eventos do Asaas sem inscrição correspondente (órfãos)
 */
export async function diagnosticoSaude(): Promise<DiagnosticoSaude> {
  const [venc, semCob, antigos, dups, orfaos, ult] = await Promise.all([
    sql`SELECT *, COUNT(*) OVER() AS _total FROM inscricoes
         WHERE status = 'pending' AND asaas_payment_id IS NOT NULL
           AND due_date IS NOT NULL AND due_date < CURRENT_DATE AND NOT is_teste
         ORDER BY due_date ASC LIMIT 50`,
    sql`SELECT *, COUNT(*) OVER() AS _total FROM inscricoes
         WHERE status <> 'cancelled' AND asaas_payment_id IS NULL AND NOT is_teste
         ORDER BY created_at DESC LIMIT 50`,
    sql`SELECT *, COUNT(*) OVER() AS _total FROM inscricoes
         WHERE status = 'pending' AND created_at < NOW() - INTERVAL '7 days' AND NOT is_teste
         ORDER BY created_at ASC LIMIT 50`,
    sql`SELECT cpf_cnpj, curso_slug, valor_centavos, COUNT(*) AS qtde, COUNT(*) OVER() AS _total
          FROM inscricoes
         WHERE status <> 'cancelled' AND NOT is_teste
         GROUP BY cpf_cnpj, curso_slug, valor_centavos
        HAVING COUNT(*) > 1
        ORDER BY qtde DESC LIMIT 50`,
    sql`SELECT e.asaas_payment_id, COUNT(*) AS eventos, MAX(e.received_at) AS ultimo, COUNT(*) OVER() AS _total
          FROM asaas_eventos e
          LEFT JOIN inscricoes i ON i.asaas_payment_id = e.asaas_payment_id
         WHERE e.asaas_payment_id IS NOT NULL AND i.id IS NULL
         GROUP BY e.asaas_payment_id
         ORDER BY ultimo DESC LIMIT 50`,
    sql`SELECT MAX(last_synced_at) AS m FROM inscricoes`,
  ])

  const dupRows = (dups as Array<DuplicataGrupo & { _total?: string | number }>).map((r) => ({
    cpf_cnpj: String(r.cpf_cnpj),
    curso_slug: String(r.curso_slug),
    valor_centavos: Number(r.valor_centavos),
    qtde: Number(r.qtde),
    _total: r._total,
  }))
  const orfaoRows = (orfaos as Array<EventoOrfao & { _total?: string | number }>).map((r) => ({
    asaas_payment_id: String(r.asaas_payment_id),
    eventos: Number(r.eventos),
    ultimo: String(r.ultimo),
    _total: r._total,
  }))

  return {
    pendentesVencidos: comTotal(venc as Array<InscricaoRow & { _total?: string | number }>),
    semCobranca: comTotal(semCob as Array<InscricaoRow & { _total?: string | number }>),
    pendentesAntigos: comTotal(antigos as Array<InscricaoRow & { _total?: string | number }>),
    possiveisDuplicatas: comTotal(dupRows),
    eventosOrfaos: comTotal(orfaoRows),
    ultimaConciliacao: (ult as Array<{ m: string | null }>)[0]?.m ?? null,
  }
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
