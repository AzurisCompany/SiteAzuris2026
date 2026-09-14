// POST /api/dss-business/inscricao
// Checkout do ingresso Business do DSS 2026 — lote que vira sozinho por quantidade
// ([[lotes-quantidade]]). Mesma lógica de [[checkout-produto]]; o registry marca o
// produto como `tipoObrigatorio`, então só o lote vigente é vendido.
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
  const r = await processarCheckout('dss-business-2026', body)
  return NextResponse.json(r.body, { status: r.status })
}
