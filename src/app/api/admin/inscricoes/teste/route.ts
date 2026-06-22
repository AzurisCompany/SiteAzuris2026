// POST /api/admin/inscricoes/teste  (protegido)
//   body { id, teste }  → marca/desmarca uma inscrição como registro de teste.
// Registros de teste somem da lista de vendas e dos KPIs por padrão (sem apagar).
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { marcarTeste } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }
  const body = (await request.json().catch(() => ({}))) as { id?: number; teste?: boolean }
  if (typeof body.id !== 'number' || typeof body.teste !== 'boolean') {
    return NextResponse.json({ error: 'informe { id: number, teste: boolean }' }, { status: 400 })
  }
  const row = await marcarTeste(body.id, body.teste)
  if (!row) return NextResponse.json({ error: 'inscrição não encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true, id: row.id, is_teste: row.is_teste })
}
