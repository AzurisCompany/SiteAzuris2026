// POST /api/vendas/link
// A vendedora manda o código dela e recebe um cupom assinado ([[cupom]]) pro
// FullPass do DSS. Quem monta a URL final é a página /vendas, com a origem do
// próprio navegador — assim o link sai certo em produção e em preview.
//
// Sem sessão e sem cookie: o código É a credencial. O registro de vendedoras
// vive na config do admin (chave `vendedoras`), editável sem deploy.
import { NextResponse } from 'next/server'
import { getConfigsFinanceiro } from '@/lib/db'
import {
  acharVendedora,
  criarCupom,
  formatarValidade,
  parseVendedoras,
  CUPOM_PCT_PADRAO,
  VALIDADE_HORAS_PADRAO,
} from '@/lib/cupom'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Produto que o link de vendedora vende hoje. */
const PRODUTO = 'dss-2026'
const CAMINHO_CHECKOUT = '/dssbr-2026/inscricao'

/** Atrasa a resposta de erro — encarece brute force no código sem incomodar quem acerta. */
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function POST(request: Request) {
  let body: { codigo?: string; cliente?: string }
  try {
    body = (await request.json()) as { codigo?: string; cliente?: string }
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  let config: Record<string, string>
  try {
    config = await getConfigsFinanceiro()
  } catch {
    return NextResponse.json({ error: 'Não consegui ler o cadastro agora. Tenta de novo.' }, { status: 503 })
  }

  const vendedoras = parseVendedoras(config.vendedoras)
  const vendedora = acharVendedora(vendedoras, body.codigo)
  if (!vendedora) {
    await espera(400)
    // Mensagem única pra código errado e pra lista vazia: quem digita errado não
    // precisa saber se o cadastro existe.
    return NextResponse.json({ error: 'Código não confere. Confere com o Binhara.' }, { status: 401 })
  }

  let token: string
  let exp: number
  try {
    const c = criarCupom({ vendedora: vendedora.slug, produto: PRODUTO })
    token = c.token
    exp = c.cupom.exp
  } catch (e) {
    // Só acontece se faltar segredo de assinatura no ambiente.
    console.error('Falha ao assinar cupom de vendedora:', e)
    return NextResponse.json({ error: 'Geração de link indisponível. Avisa o Binhara.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    vendedora: { nome: vendedora.nome, slug: vendedora.slug },
    cliente: (body.cliente ?? '').trim().slice(0, 60) || null,
    caminho: CAMINHO_CHECKOUT,
    token,
    utm: { source: 'vendedora', medium: 'link', content: vendedora.slug },
    pct: CUPOM_PCT_PADRAO,
    horas: VALIDADE_HORAS_PADRAO,
    expiraEm: exp,
    expiraLabel: formatarValidade(exp),
  })
}
