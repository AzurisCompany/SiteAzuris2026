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
import { produtoComCupom } from '@/lib/cupom-produtos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


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

  // Um link por ingresso em que o cupom vale: o token assina o produto, então o
  // link do One Day não abre desconto no VIP. Todos com o MESMO prazo.
  const produtos = cupom.produtos.map(produtoComCupom).filter((p) => p != null)
  if (produtos.length === 0) {
    return NextResponse.json({ error: 'Cupom cadastrado num produto sem página de checkout.' }, { status: 500 })
  }

  const agora = Date.now()
  let links: Array<{ produto: string; nome: string; caminho: string; token: string }>
  let exp: number
  try {
    links = produtos.map((p) => ({
      produto: p.slug,
      nome: p.nome,
      caminho: p.caminho,
      token: criarCupom(
        {
          codigo: cupom.codigo,
          produto: p.slug,
          pct: cupom.pct,
          horas: cupom.validade_horas ?? VALIDADE_HORAS_PADRAO,
        },
        agora,
      ).token,
    }))
    exp = agora + (cupom.validade_horas ?? VALIDADE_HORAS_PADRAO) * 60 * 60 * 1000
  } catch (e) {
    // Só acontece se faltar segredo de assinatura no ambiente.
    console.error('Falha ao assinar cupom de vendedora:', e)
    return NextResponse.json({ error: 'Geração de link indisponível. Avisa o Binhara.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    vendedora: { nome: cupom.nome, slug: cupom.codigo },
    cliente: (body.cliente ?? '').trim().slice(0, 60) || null,
    links,
    utm: { source: 'vendedora', medium: 'link', content: cupom.codigo },
    pct: cupom.pct,
    horas: cupom.validade_horas ?? VALIDADE_HORAS_PADRAO,
    expiraEm: exp,
    expiraLabel: formatarValidade(exp),
  })
}
