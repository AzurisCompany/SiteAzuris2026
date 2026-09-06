// POST /api/cafe-networking/inscricao
// Inscrição do café da manhã de networking do DSSBR no IEP. Mesma lógica
// compartilhada de [[checkout-produto]]: tipo Geral (R$ 30, PIX/cartão 3x) gera
// cobrança no Asaas; tipo Convidado (grátis) só cadastra, sem cobrança.
// Qual edição está em cartaz é decisão de [[cafe-networking/evento]] — a rota não sabe a data.
import { NextResponse } from 'next/server'
import { processarCheckout, type CheckoutBody } from '@/lib/checkout-produto'
import { CAFE_SLUG } from '@/app/cafe-networking/evento'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: CheckoutBody
  try {
    body = (await request.json()) as CheckoutBody
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const r = await processarCheckout(CAFE_SLUG, body)
  return NextResponse.json(r.body, { status: r.status })
}
