// POST /api/dssbr-2026/inscricao
// Checkout do FullPass do DSS 2026. A lógica (validação → preço no servidor →
// criarCobranca) vive em [[checkout-produto]], compartilhada com o GU BigData.
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
  const r = await processarCheckout('dss-2026', body)
  return NextResponse.json(r.body, { status: r.status })
}
