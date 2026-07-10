// Sincronização: puxa o estado real de uma cobrança no Asaas e consolida no DB.
// Usado pelo endpoint /api/admin/sync (botão no detalhe + backfill "sincronizar tudo").
import { getPayment, mapAsaasStatus } from '@/lib/asaas'
import { consolidarAsaas, sql } from '@/lib/db'

export interface ResultadoSync {
  ok: boolean
  status?: string
  error?: string
}

export async function sincronizarInscricao(row: { asaas_payment_id: string | null }): Promise<ResultadoSync> {
  if (!row.asaas_payment_id) return { ok: false, error: 'inscrição sem asaas_payment_id' }
  try {
    const p = await getPayment(row.asaas_payment_id)
    const status = mapAsaasStatus(p.status)
    const bruto = typeof p.value === 'number' ? Math.round(p.value * 100) : null
    const liquido = typeof p.netValue === 'number' ? Math.round(p.netValue * 100) : null
    const taxa = bruto != null && liquido != null ? bruto - liquido : null
    const pago = p.clientPaymentDate || p.paymentDate || p.confirmedDate || null
    const paid_at = status === 'paid' ? pago ?? new Date().toISOString() : null
    await consolidarAsaas(row.asaas_payment_id, {
      status,
      asaas_status: p.status,
      valor_liquido_centavos: liquido,
      taxa_centavos: taxa,
      due_date: p.dueDate ?? null,
      pago_em: pago,
      paid_at,
    })
    return { ok: true, status }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'erro desconhecido' }
  }
}

export interface FalhaConciliacao {
  id: number
  nome: string
  email: string
  status: string
  valor_centavos: number
  asaas_payment_id: string
  is_teste: boolean
  created_at: string
  erro: string
  tipo: 'nao_existe_no_asaas' | 'outro'
}

/**
 * DIAGNÓSTICO (dry-run, NÃO escreve): pra cada cobrança não-final com
 * asaas_payment_id, tenta getPayment e reporta as que falham + o motivo. É o
 * "porquê" por trás do `erros: N` do cron. `nao_existe_no_asaas` (404) = quase
 * sempre linha de teste/sandbox cujo pagamento não existe na conta de produção.
 */
export async function diagnosticarConciliacao(): Promise<{
  total: number
  ok: number
  falhas: FalhaConciliacao[]
}> {
  const rows = (await sql.query(
    `SELECT id, nome, email, status, valor_centavos, asaas_payment_id, is_teste, created_at
       FROM inscricoes
      WHERE asaas_payment_id IS NOT NULL
        AND (status IN ('pending','overdue') OR (status = 'paid' AND taxa_centavos IS NULL))
      ORDER BY created_at DESC`,
  )) as Array<{
    id: number
    nome: string
    email: string
    status: string
    valor_centavos: number
    asaas_payment_id: string
    is_teste: boolean
    created_at: string
  }>

  let ok = 0
  const falhas: FalhaConciliacao[] = []
  for (const r of rows) {
    try {
      await getPayment(r.asaas_payment_id)
      ok++
    } catch (e) {
      const erro = e instanceof Error ? e.message : 'erro desconhecido'
      const tipo: FalhaConciliacao['tipo'] =
        /\b40[04]\b|not found|invalid object|não encontrad/i.test(erro) ? 'nao_existe_no_asaas' : 'outro'
      falhas.push({
        id: r.id,
        nome: r.nome,
        email: r.email,
        status: r.status,
        valor_centavos: r.valor_centavos,
        asaas_payment_id: r.asaas_payment_id,
        is_teste: r.is_teste,
        created_at: r.created_at,
        erro,
        tipo,
      })
    }
  }
  return { total: rows.length, ok, falhas }
}

export async function sincronizarTodas(
  somenteNaoFinais = false
): Promise<{ total: number; sincronizadas: number; erros: number }> {
  // Não-finais = pending/overdue. Inclui também pagas SEM taxa consolidada
  // (ex.: ciclos de assinatura materializados antes do netValue existir) pra
  // auto-curar o financeiro/DRE. [[project_admin_roadmap]]
  const where = somenteNaoFinais
    ? `WHERE asaas_payment_id IS NOT NULL AND (status IN ('pending','overdue') OR (status = 'paid' AND taxa_centavos IS NULL))`
    : `WHERE asaas_payment_id IS NOT NULL`
  const rows = (await sql.query(`SELECT asaas_payment_id FROM inscricoes ${where}`)) as Array<{
    asaas_payment_id: string
  }>
  let sincronizadas = 0
  let erros = 0
  for (const r of rows) {
    const res = await sincronizarInscricao(r)
    if (res.ok) sincronizadas++
    else erros++
  }
  return { total: rows.length, sincronizadas, erros }
}
