// POST /api/gubigdata/inscricao
// Inscrição do encontro presencial GU BigData & IA no IEP. Mesma lógica
// compartilhada de [[checkout-produto]]: tipo Geral (R$ 30, PIX/cartão 3x) gera
// cobrança no Asaas; tipo Associado (grátis) só cadastra, sem cobrança.
// Qual encontro está em cartaz é decisão de [[gubigdata/evento]] — a rota não sabe a data.
import { NextResponse } from 'next/server'
import { processarCheckout, type CheckoutBody } from '@/lib/checkout-produto'
import { EVENTO_GU_SLUG } from '@/app/gubigdata/evento'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: CheckoutBody
  try {
    body = (await request.json()) as CheckoutBody
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const r = await processarCheckout(EVENTO_GU_SLUG, body)
  return NextResponse.json(r.body, { status: r.status })
}
