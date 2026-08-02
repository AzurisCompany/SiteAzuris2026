// GET  /api/admin/email-teste  (protegido) — a config: se há key e qual remetente.
// POST /api/admin/email-teste  (protegido) — manda um e-mail de exemplo pra você.
//   { destino?: string, produto?: string }
//
// Existe porque a única outra forma de exercitar o envio é pagar uma cobrança de
// verdade. Não toca no banco: nenhuma inscrição é criada ou marcada.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { conteudoCompraConfirmada } from '@/lib/email/conteudo'
import { enviarCompraConfirmada, configEmail } from '@/lib/email/enviar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET() {
  if (!(await estaLogado())) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  return NextResponse.json({
    ok: true,
    ...configEmail(),
    destinoPadrao: process.env.EMAIL_TESTE_DESTINO_PADRAO ?? null,
  })
}

export async function POST(request: Request) {
  if (!(await estaLogado())) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })

  let body: { destino?: string; produto?: string } = {}
  try {
    body = (await request.json()) as { destino?: string; produto?: string }
  } catch {
    // corpo vazio é aceito: cai no destino padrão
  }

  const destino = (body.destino ?? process.env.EMAIL_TESTE_DESTINO_PADRAO ?? '').trim()
  if (!RE_EMAIL.test(destino)) {
    return NextResponse.json({ error: 'Informe um e-mail válido (ou defina EMAIL_TESTE_DESTINO_PADRAO)' }, { status: 400 })
  }

  const conteudo = conteudoCompraConfirmada({
    nome: 'Teste da Silva',
    produtoSlug: body.produto ?? 'ett-adesao',
    valorCentavos: 6700,
  })
  // Deixa explícito na caixa de entrada que não foi uma venda de verdade.
  const r = await enviarCompraConfirmada({
    para: destino,
    conteudo: { ...conteudo, assunto: `[TESTE] ${conteudo.assunto}` },
  })

  if (!r.ok) return NextResponse.json({ error: r.erro }, { status: 502 })
  return NextResponse.json({ ok: true, id: r.id, destino, assunto: `[TESTE] ${conteudo.assunto}` })
}
