// /api/admin/cupons  (protegido) — CRUD dos cupons de desconto ([[cupons]]).
//   GET              → lista com quanto cada um já vendeu
//   POST  { ...cupom } → cria ou atualiza (upsert pelo código)
//   DELETE { id }    → remove
//
// O código é normalizado no servidor (minúsculas, sem acento): quem cadastrou
// "CEL 01" e quem digitou "cel-01" caem na mesma linha.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { listarCuponsComUso, upsertCupom, deletarCupom, type TipoCupom } from '@/lib/cupons'
import { normalizarCodigo, codigoValido, CUPOM_PCT_MAX } from '@/lib/cupom'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await estaLogado())) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  try {
    return NextResponse.json({ ok: true, cupons: await listarCuponsComUso() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: `Falha ao listar: ${msg}` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await estaLogado())) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })

  let b: {
    codigo?: string
    nome?: string
    tipo?: string
    produto_slug?: string
    pct?: number
    validade_horas?: number | null
    limite_usos?: number | null
    ativo?: boolean
  }
  try {
    b = (await request.json()) as typeof b
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const nome = (b.nome ?? '').trim()
  if (nome.length < 2) return NextResponse.json({ error: 'Escreve o nome de quem vai usar o cupom.' }, { status: 400 })

  const codigo = normalizarCodigo(b.codigo)
  if (!codigoValido(codigo)) {
    return NextResponse.json({ error: 'Código precisa de ao menos 3 letras ou números.' }, { status: 400 })
  }

  const tipo: TipoCupom = b.tipo === 'parceiro' ? 'parceiro' : 'vendedora'

  const pct = Number(b.pct)
  if (!Number.isInteger(pct) || pct < 1 || pct > CUPOM_PCT_MAX) {
    return NextResponse.json({ error: `Desconto tem que ser um número inteiro de 1 a ${CUPOM_PCT_MAX}.` }, { status: 400 })
  }

  const produto_slug = (b.produto_slug ?? '').trim()
  if (!produto_slug) return NextResponse.json({ error: 'Escolhe o produto.' }, { status: 400 })

  // Prazo: vendedora sempre tem (link morre sozinho); parceiro pode não ter.
  const horasNum = Number(b.validade_horas)
  const validade_horas =
    Number.isInteger(horasNum) && horasNum >= 1 ? Math.min(horasNum, 24 * 365) : tipo === 'vendedora' ? 48 : null

  const limiteNum = Number(b.limite_usos)
  const limite_usos = Number.isInteger(limiteNum) && limiteNum >= 1 ? limiteNum : null

  try {
    const cupom = await upsertCupom({
      codigo,
      nome,
      tipo,
      produto_slug,
      pct,
      validade_horas,
      limite_usos,
      ativo: b.ativo !== false,
    })
    return NextResponse.json({ ok: true, cupom })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: `Falha ao salvar: ${msg}` }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await estaLogado())) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const b = (await request.json().catch(() => ({}))) as { id?: number }
  if (typeof b.id !== 'number') return NextResponse.json({ error: 'informe { id }' }, { status: 400 })
  await deletarCupom(b.id)
  return NextResponse.json({ ok: true })
}
