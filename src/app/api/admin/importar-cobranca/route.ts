// POST /api/admin/importar-cobranca  (protegido)
//   body { asaas_payment_id, is_teste? } → importa 1 cobrança avulsa
//   body { installment_id,  is_teste? } → importa 1 parcelamento inteiro (soma as parcelas)
// Cria inscrição a partir de cobrança que existe no Asaas mas não no banco. Idempotente.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { importarCobranca, importarInstallment } from '@/lib/importar-asaas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }
  const body = (await request.json().catch(() => ({}))) as {
    asaas_payment_id?: string
    installment_id?: string
    is_teste?: boolean
  }
  const is_teste = body.is_teste === true

  const installmentId = typeof body.installment_id === 'string' ? body.installment_id.trim() : ''
  const paymentId = typeof body.asaas_payment_id === 'string' ? body.asaas_payment_id.trim() : ''

  const r = installmentId
    ? await importarInstallment(installmentId, { is_teste })
    : paymentId
      ? await importarCobranca(paymentId, { is_teste })
      : null

  if (!r) {
    return NextResponse.json({ error: 'informe { asaas_payment_id } ou { installment_id }' }, { status: 400 })
  }
  if (!r.ok) return NextResponse.json({ error: r.erro }, { status: 502 })
  return NextResponse.json(r)
}
