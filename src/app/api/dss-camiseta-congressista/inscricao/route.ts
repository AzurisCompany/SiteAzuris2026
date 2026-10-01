// POST /api/dss-camiseta-congressista/inscricao
// Checkout da camiseta oficial do DSS 2026 (valor de congressista, compra antecipada). Mesma lógica de
// [[checkout-produto]]; o registry marca `quantidadeMax`, então o servidor exige o
// tamanho (tipo) e cobra preço do tipo × quantidade.
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
  const r = await processarCheckout('camiseta-congressista-dss-2026', body)
  return NextResponse.json(r.body, { status: r.status })
}
