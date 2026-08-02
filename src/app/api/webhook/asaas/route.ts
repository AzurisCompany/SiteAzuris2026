// POST /api/webhook/asaas
// Recebe notificações do Asaas (pagamento confirmado, expirado, refundado, etc.)
// Atualiza o status da inscrição no DB.
//
// Configurar URL no painel Asaas em: Integrações → Notificações → Webhooks
// URL: https://azuris.com.br/api/webhook/asaas
// Token: valor de ASAAS_WEBHOOK_TOKEN (header asaas-access-token)

import { NextResponse } from 'next/server'
import {
  atualizarStatusPorAsaasId,
  atualizarFinanceiroPorAsaasId,
  registrarEvento,
  materializarCicloAssinatura,
  type InscricaoStatus,
} from '@/lib/db'
import type { AsaasEvent, AsaasWebhookPayload } from '@/lib/asaas'
import { notificarPagamentoConfirmado } from '@/lib/email/notificar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN

const EVENT_TO_STATUS: Partial<Record<AsaasEvent, InscricaoStatus>> = {
  PAYMENT_CONFIRMED: 'paid',
  PAYMENT_RECEIVED: 'paid',
  PAYMENT_OVERDUE: 'overdue',
  PAYMENT_DELETED: 'cancelled',
  PAYMENT_REFUNDED: 'refunded',
  PAYMENT_CHARGEBACK_REQUESTED: 'refunded',
}

export async function POST(request: Request) {
  // Valida token
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

  // Auditoria: grava todo evento cru (não bloqueia o fluxo se falhar)
  try {
    await registrarEvento(paymentId, event, payload.payment)
  } catch (e) {
    console.error('Falha ao registrar evento Asaas:', e)
  }

  // Assinatura: se o pagamento é de um ciclo recorrente e ainda não existe
  // inscrição pra ele, materializa (idempotente) — assim o mês cobrado aparece.
  if (payload.payment?.subscription) {
    try {
      await materializarCicloAssinatura(payload.payment)
    } catch (e) {
      console.error('Falha ao materializar ciclo de assinatura:', e)
    }
  }

  const newStatus = EVENT_TO_STATUS[event]
  if (!newStatus) {
    // Eventos que não mudam status (PAYMENT_CREATED, PAYMENT_UPDATED, PAYMENT_BANK_SLIP_VIEWED, etc.)
    // — só logamos. Asaas espera 200 OK pra não reenviar.
    console.log(`Webhook Asaas: evento ${event} pra payment ${paymentId} (sem ação)`)
    return NextResponse.json({ ok: true, action: 'noop' })
  }

  const paidAt = newStatus === 'paid' ? new Date().toISOString() : null
  const row = await atualizarStatusPorAsaasId(paymentId, newStatus, paidAt)

  // Consolida líquido/taxa a partir do payload (essencial pros ciclos de assinatura,
  // que não passam por vincularAsaas na criação). COALESCE preserva se vier sem netValue.
  const p = payload.payment
  const bruto = typeof p.value === 'number' ? Math.round(p.value * 100) : null
  const liquido = typeof p.netValue === 'number' ? Math.round(p.netValue * 100) : null
  try {
    await atualizarFinanceiroPorAsaasId(paymentId, {
      valor_liquido_centavos: liquido,
      taxa_centavos: bruto != null && liquido != null ? bruto - liquido : null,
      due_date: p.dueDate ?? null,
      asaas_status: p.status ?? null,
    })
  } catch (e) {
    console.error('Falha ao consolidar financeiro no webhook:', e)
  }

  if (!row) {
    // Pode acontecer se o webhook chegar antes da inserção da inscrição no DB
    // (improvável, mas Asaas é rápido). Logamos e retornamos 200 — o Asaas reenviará se erro.
    console.warn(`Webhook Asaas: payment ${paymentId} não encontrado no DB`)
    return NextResponse.json({ ok: true, action: 'not_found' })
  }

  console.log(`Webhook Asaas: ${event} → inscricao ${row.id} (${row.email}) status=${newStatus}`)

  // E-mail de confirmação: efeito colateral, uma vez só por inscrição, e engole o
  // próprio erro — o Asaas reenvia o webhook se a gente não devolver 200.
  if (newStatus === 'paid') {
    await notificarPagamentoConfirmado(row)
  }

  return NextResponse.json({ ok: true, action: 'updated', inscricaoId: row.id })
}
