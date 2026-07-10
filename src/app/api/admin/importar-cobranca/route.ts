// POST /api/admin/importar-cobranca  (protegido)
//   body { asaas_payment_id, is_teste? } → cria inscrição a partir de uma cobrança
//   que existe no Asaas mas não no banco (criada no painel). Idempotente.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { importarCobranca } from '@/lib/importar-asaas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }
  const body = (await request.json().catch(() => ({}))) as { asaas_payment_id?: string; is_teste?: boolean }
  const id = typeof body.asaas_payment_id === 'string' ? body.asaas_payment_id.trim() : ''
  if (!id) {
    return NextResponse.json({ error: 'informe { asaas_payment_id }' }, { status: 400 })
  }
  const r = await importarCobranca(id, { is_teste: body.is_teste === true })
  if (!r.ok) return NextResponse.json({ error: r.erro }, { status: 502 })
  return NextResponse.json(r)
}
