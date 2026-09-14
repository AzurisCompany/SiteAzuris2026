// POST /api/admin/inscricoes/ingresso-gerado  (protegido)
//   body { id, gerado }  → marca/desmarca o ingresso da inscrição como gerado.
// Grava `ingresso_gerado_em` (NULL = não gerado). Se a migração ainda não rodou,
// responde 503 dizendo isso — em vez de um 500 genérico.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { marcarIngressoGerado } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }
  const body = (await request.json().catch(() => ({}))) as { id?: number; gerado?: boolean }
  if (typeof body.id !== 'number' || typeof body.gerado !== 'boolean') {
    return NextResponse.json({ error: 'informe { id: number, gerado: boolean }' }, { status: 400 })
  }
  try {
    const row = await marcarIngressoGerado(body.id, body.gerado)
    if (!row) return NextResponse.json({ error: 'inscrição não encontrada' }, { status: 404 })
    return NextResponse.json({ ok: true, id: row.id, ingresso_gerado_em: row.ingresso_gerado_em ?? null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('ingresso_gerado_em')) {
      return NextResponse.json(
        { error: 'coluna ingresso_gerado_em não existe — rode POST /api/admin/migrate' },
        { status: 503 }
      )
    }
    throw e
  }
}
