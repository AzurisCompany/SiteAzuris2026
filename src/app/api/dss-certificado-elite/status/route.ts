// GET /api/dss-certificado-elite/status?id=pay_xxx
// A tela do PIX do Upgrade Elite consulta isto até o webhook marcar a venda como paga.
// Lê o NOSSO banco; só responde cobrança dos produtos do Upgrade Elite.
import { NextResponse } from 'next/server'
import { statusPorAsaasId } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SLUGS = ['certificado-elite-digital-dss-2026', 'certificado-elite-impresso-dss-2026', 'slides-elite-dss-2026']

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!/^pay_[A-Za-z0-9]+$/.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  try {
    for (const slug of SLUGS) {
      const status = await statusPorAsaasId(slug, id)
      if (status) return NextResponse.json({ status })
    }
    return NextResponse.json({ error: 'cobrança não encontrada' }, { status: 404 })
  } catch {
    return NextResponse.json({ error: 'indisponível' }, { status: 503 })
  }
}
