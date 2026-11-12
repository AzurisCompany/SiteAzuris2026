// POST /api/dss-upgrade-videos
// Checkout do upgrade de vídeos do DSS 2026 (qualquer ingresso). Mesma lógica de
// [[checkout-produto]]; preço fixo no registry e PIX na nossa tela (`pixNaTela`).
// O status do PIX é o compartilhado: /api/dss-certificado-elite/status.
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
  const r = await processarCheckout('upgrade-videos-dss-2026', body)
  return NextResponse.json(r.body, { status: r.status })
}
