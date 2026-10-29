// GET /api/dss-2027-preload/status?id=pay_xxx
// A tela do PIX consulta isto a cada poucos segundos até o webhook do Asaas marcar a
// venda como paga. Lê o NOSSO banco, não o Asaas: quem confirma é o webhook. Devolve só
// o status, e só de cobrança deste produto.
import { NextResponse } from 'next/server'
import { statusPorAsaasId } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!/^pay_[A-Za-z0-9]+$/.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  try {
    const status = await statusPorAsaasId('dss-2027-preload', id)
    if (!status) return NextResponse.json({ error: 'cobrança não encontrada' }, { status: 404 })
    return NextResponse.json({ status })
  } catch {
    return NextResponse.json({ error: 'indisponível' }, { status: 503 })
  }
}
