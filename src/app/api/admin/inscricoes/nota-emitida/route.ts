// POST /api/admin/inscricoes/nota-emitida  (protegido)
//   body { id, emitida }  → marca/desmarca a nota fiscal da inscrição como emitida.
// Grava `nf_emitida_em` (NULL = não marcada). É pra nota emitida fora do sistema; a
// emitida pelo Asaas vive em `nf_status`. Se a migração ainda não rodou, responde 503
// dizendo isso — em vez de um 500 genérico.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { marcarNotaEmitida } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }
  const body = (await request.json().catch(() => ({}))) as { id?: number; emitida?: boolean }
  if (typeof body.id !== 'number' || typeof body.emitida !== 'boolean') {
    return NextResponse.json({ error: 'informe { id: number, emitida: boolean }' }, { status: 400 })
  }
  try {
    const row = await marcarNotaEmitida(body.id, body.emitida)
    if (!row) return NextResponse.json({ error: 'inscrição não encontrada' }, { status: 404 })
    return NextResponse.json({ ok: true, id: row.id, nf_emitida_em: row.nf_emitida_em ?? null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('nf_emitida_em')) {
      return NextResponse.json(
        { error: 'coluna nf_emitida_em não existe — rode POST /api/admin/migrate' },
        { status: 503 }
      )
    }
    throw e
  }
}
