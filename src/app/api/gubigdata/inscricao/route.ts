// POST /api/gubigdata/inscricao
// Inscrição do encontro presencial GU BigData & IA (30/07, IEP). Mesma lógica
// compartilhada de [[checkout-produto]]: tipo Geral (R$ 30, PIX/cartão 3x) gera
// cobrança no Asaas; tipo Associado (grátis) só cadastra, sem cobrança.
import { NextResponse } from 'next/server'
import { processarCheckout, type CheckoutBody } from '@/lib/checkout-produto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: CheckoutBody
  try {
    body = (await request.json()) as CheckoutBody
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const r = await processarCheckout('gubigdata-2026-07', body)
  return NextResponse.json(r.body, { status: r.status })
}
