// POST /api/preparatorio-dados/inscricao
// Reserva de interesse do curso preparatório (Python/SQL/Docker). Mesma lógica
// compartilhada de [[checkout-produto]]: o único tipo ('reserva') é gratuito, então
// cai sempre no fluxo sem CPF e sem Asaas — só cadastro, com dedupe por e-mail.
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
  const r = await processarCheckout('preparatorio-dados', body)
  return NextResponse.json(r.body, { status: r.status })
}
