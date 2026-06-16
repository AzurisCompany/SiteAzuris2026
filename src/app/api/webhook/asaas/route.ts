// POST /api/webhook/asaas
// Recebe notificações do Asaas (pagamento confirmado, expirado, refundado, etc.)
// Atualiza o status da inscrição no DB.
//
// Configurar URL no painel Asaas em: Integrações → Notificações → Webhooks
// URL: https://azuris.com.br/api/webhook/asaas
// Token: valor de ASAAS_WEBHOOK_TOKEN (header asaas-access-token)

import { NextResponse } from 'next/server'
import { atualizarStatusPorAsaasId, registrarEvento, type InscricaoStatus } from '@/lib/db'
import type { AsaasEvent, AsaasWebhookPayload } from '@/lib/asaas'

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

  const newStatus = EVENT_TO_STATUS[event]
  if (!newStatus) {
    // Eventos que não mudam status (PAYMENT_CREATED, PAYMENT_UPDATED, PAYMENT_BANK_SLIP_VIEWED, etc.)
    // — só logamos. Asaas espera 200 OK pra não reenviar.
    console.log(`Webhook Asaas: evento ${event} pra payment ${paymentId} (sem ação)`)
    return NextResponse.json({ ok: true, action: 'noop' })
  }

  const paidAt = newStatus === 'paid' ? new Date().toISOString() : null
  const row = await atualizarStatusPorAsaasId(paymentId, newStatus, paidAt)

  if (!row) {
    // Pode acontecer se o webhook chegar antes da inserção da inscrição no DB
    // (improvável, mas Asaas é rápido). Logamos e retornamos 200 — o Asaas reenviará se erro.
    console.warn(`Webhook Asaas: payment ${paymentId} não encontrado no DB`)
    return NextResponse.json({ ok: true, action: 'not_found' })
  }

  console.log(`Webhook Asaas: ${event} → inscricao ${row.id} (${row.email}) status=${newStatus}`)

  return NextResponse.json({ ok: true, action: 'updated', inscricaoId: row.id })
}
