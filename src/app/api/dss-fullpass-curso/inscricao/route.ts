// POST /api/dss-fullpass-curso/inscricao
// Checkout do combo FullPass + portal do curso Pipeline. Mesma lógica compartilhada
// de [[checkout-produto]] — só muda o slug do produto no registry [[produtos]].
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
  const r = await processarCheckout('dss-fullpass-curso-2026', body)
  return NextResponse.json(r.body, { status: r.status })
}
