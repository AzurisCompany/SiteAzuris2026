// /api/admin/ingressos  (protegido) — CRUD do catálogo de tipos de ingresso.
//   GET    ?produto=slug  → lista tipos (todos, ou de um produto)
//   POST   { ...tipo }    → cria ou atualiza (upsert por produto_slug+tipo_id)
//   DELETE { id }         → remove um tipo
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { listarTipos, upsertTipo, deletarTipo, type UpsertTipoInput } from '@/lib/tipos-ingresso'
import { MAX_PARCELAS } from '@/lib/parcelamento'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(request: Request) {
  if (!(await estaLogado())) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const produto = new URL(request.url).searchParams.get('produto') || undefined
  const tipos = await listarTipos(produto)
  return NextResponse.json({ ok: true, tipos })
}

export async function POST(request: Request) {
  if (!(await estaLogado())) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })

  let b: Partial<UpsertTipoInput> & { nome?: string; tipo_id?: string }
  try {
    b = (await request.json()) as typeof b
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!b.produto_slug || typeof b.produto_slug !== 'string') return NextResponse.json({ error: 'produto_slug obrigatório' }, { status: 400 })
  if (!b.nome || b.nome.trim().length < 2) return NextResponse.json({ error: 'Nome do tipo inválido' }, { status: 400 })
  // tipo_id derivado do nome se não vier (e nunca muda depois — é a chave lógica).
  const tipo_id = (b.tipo_id && b.tipo_id.trim() ? slugify(b.tipo_id) : slugify(b.nome))
  if (!tipo_id) return NextResponse.json({ error: 'Não consegui gerar o identificador do tipo' }, { status: 400 })

  // R$ 0 = ingresso gratuito (só cadastro, sem Asaas); pago tem mínimo de R$ 1,00.
  const preco = Number(b.preco_centavos)
  if (!Number.isInteger(preco) || (preco !== 0 && preco < 100))
    return NextResponse.json({ error: 'Preço inválido (R$ 0,00 = grátis; pago tem mínimo R$ 1,00)' }, { status: 400 })

  const vendas_ate = typeof b.vendas_ate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.vendas_ate) ? b.vendas_ate : null
  const limiteNum = Number(b.limite_qtd)
  const limite_qtd = Number.isInteger(limiteNum) && limiteNum >= 1 ? limiteNum : null

  const num = (v: unknown, def = 0) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : def
  }

  try {
    const tipo = await upsertTipo({
      produto_slug: b.produto_slug.trim(),
      tipo_id,
      nome: b.nome.trim(),
      descricao: b.descricao?.toString().trim() || null,
      preco_centavos: preco,
      preco_de_centavos: Math.max(0, Math.round(num(b.preco_de_centavos))),
      pix_desconto_pct: Math.min(Math.max(num(b.pix_desconto_pct), 0), 100),
      cartao_acrescimo_pct: Math.min(Math.max(num(b.cartao_acrescimo_pct), 0), 100),
      max_parcelas: Math.min(Math.max(Math.round(num(b.max_parcelas, 1)), 1), MAX_PARCELAS),
      ativo: b.ativo !== false,
      // Oculto só quando pedido explicitamente: o default de qualquer tipo é aparecer.
      oculto: b.oculto === true,
      ordem: Math.round(num(b.ordem)),
      vendas_ate,
      limite_qtd,
    })
    return NextResponse.json({ ok: true, tipo })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: `Falha ao salvar: ${msg}` }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await estaLogado())) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const b = (await request.json().catch(() => ({}))) as { id?: number }
  if (typeof b.id !== 'number') return NextResponse.json({ error: 'informe { id }' }, { status: 400 })
  await deletarTipo(b.id)
  return NextResponse.json({ ok: true })
}
