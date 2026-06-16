// POST /api/admin/sync  (protegido)
//   body { id }   → sincroniza uma inscrição com o Asaas
//   body { all }  → sincroniza todas (backfill)
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { getInscricao } from '@/lib/admin-queries'
import { sincronizarInscricao, sincronizarTodas } from '@/lib/asaas-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }
  const body = (await request.json().catch(() => ({}))) as { id?: number; all?: boolean }

  if (body.all) {
    const r = await sincronizarTodas(false)
    return NextResponse.json({ ok: true, ...r })
  }
  if (body.id) {
    const insc = await getInscricao(body.id)
    if (!insc) return NextResponse.json({ error: 'inscrição não encontrada' }, { status: 404 })
    const r = await sincronizarInscricao(insc)
    return NextResponse.json(r, { status: r.ok ? 200 : 502 })
  }
  return NextResponse.json({ error: 'informe { id } ou { all: true }' }, { status: 400 })
}
