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
