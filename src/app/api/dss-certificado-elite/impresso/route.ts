// POST /api/dss-certificado-elite/impresso
// Checkout do Upgrade Elite (certificado impresso) do DSS 2026. Mesma lógica de
// [[checkout-produto]]; preço fixo no registry e PIX na nossa tela (`pixNaTela`).
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
  const r = await processarCheckout('certificado-elite-impresso-dss-2026', body)
  return NextResponse.json(r.body, { status: r.status })
}
