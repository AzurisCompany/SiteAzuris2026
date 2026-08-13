// POST /api/vendas/link
// A vendedora manda o código dela e recebe um link assinado ([[cupom]]) com o
// desconto e o prazo que estiverem cadastrados em /admin/cupons ([[cupons]]).
// Quem monta a URL final é a página /vendas, com a origem do próprio navegador —
// assim o link sai certo em produção e em preview.
//
// Sem sessão e sem cookie: o código É a credencial.
import { NextResponse } from 'next/server'
import { getCupom } from '@/lib/cupons'
import { criarCupom, formatarValidade, VALIDADE_HORAS_PADRAO } from '@/lib/cupom'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CAMINHO_POR_PRODUTO: Record<string, string> = {
  'dss-2026': '/dssbr-2026/inscricao',
  'dss-one-day-2026': '/dssbr-2026/one-day',
}

/** Atrasa a resposta de erro — encarece brute force no código sem incomodar quem acerta. */
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function POST(request: Request) {
  let body: { codigo?: string; cliente?: string }
  try {
    body = (await request.json()) as { codigo?: string; cliente?: string }
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  let cupom
  try {
    cupom = await getCupom(body.codigo ?? '')
  } catch {
    return NextResponse.json({ error: 'Não consegui consultar o cadastro agora. Tenta de novo.' }, { status: 503 })
  }

  // Mensagem única pra código errado, desligado ou de parceiro: quem digita
  // errado não precisa saber qual dos casos é.
  if (!cupom || !cupom.ativo || cupom.tipo !== 'vendedora') {
    await espera(400)
    return NextResponse.json({ error: 'Código não confere. Confere com o Binhara.' }, { status: 401 })
  }

  const caminho = CAMINHO_POR_PRODUTO[cupom.produto_slug]
  if (!caminho) {
    return NextResponse.json({ error: 'Cupom cadastrado num produto sem página de checkout.' }, { status: 500 })
  }

  let token: string
  let exp: number
  try {
    const c = criarCupom({
      codigo: cupom.codigo,
      produto: cupom.produto_slug,
      pct: cupom.pct,
      horas: cupom.validade_horas ?? VALIDADE_HORAS_PADRAO,
    })
    token = c.token
    exp = c.cupom.exp
  } catch (e) {
    // Só acontece se faltar segredo de assinatura no ambiente.
    console.error('Falha ao assinar cupom de vendedora:', e)
    return NextResponse.json({ error: 'Geração de link indisponível. Avisa o Binhara.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    vendedora: { nome: cupom.nome, slug: cupom.codigo },
    cliente: (body.cliente ?? '').trim().slice(0, 60) || null,
    caminho,
    token,
    utm: { source: 'vendedora', medium: 'link', content: cupom.codigo },
    pct: cupom.pct,
    horas: cupom.validade_horas ?? VALIDADE_HORAS_PADRAO,
    expiraEm: exp,
    expiraLabel: formatarValidade(exp),
  })
}
