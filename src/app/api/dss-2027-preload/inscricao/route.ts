// POST /api/dss-2027-preload/inscricao
// Checkout do FullPass Pre-Load do DSS 2027. Mesma lógica de [[checkout-produto]]; o
// registry marca `tipoObrigatorio` (o tipo conta os 50) e `pixNaTela` (a resposta do PIX
// traz o QR Code, e a página não manda o comprador pra fatura do Asaas).
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
  const r = await processarCheckout('dss-2027-preload', body)
  return NextResponse.json(r.body, { status: r.status })
}
