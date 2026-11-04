// POST /api/dss-2027-fullpass-curso/inscricao
// Checkout do combo FullPass DSS 2027 + curso Pipeline (R$755). Mesma lógica de
// [[checkout-produto]]; preço fixo no registry, PIX na nossa tela (`pixNaTela`).
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
  const r = await processarCheckout('dss-2027-fullpass-curso', body)
  return NextResponse.json(r.body, { status: r.status })
}
