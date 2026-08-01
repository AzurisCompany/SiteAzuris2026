// POST /api/ett/adesao/inscricao
// Adesão do English Talk Time — cobrança ÚNICA de R$70. Mesma lógica compartilhada
// de [[checkout-produto]]; só muda o slug do produto no registry [[produtos]].
// A mensalidade é outro caminho: /api/ett/assinatura (recorrente, ver [[ett]]).
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
  const r = await processarCheckout('ett-adesao', body)
  return NextResponse.json(r.body, { status: r.status })
}
