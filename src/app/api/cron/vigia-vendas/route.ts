// GET /api/cron/vigia-vendas
// Vigia das vendas: uma vez por dia, olha os tipos de ingresso e avisa por e-mail
// quando algum checkout está prestes a fechar sozinho — por prazo ou por lotação.
// Nada de e-mail quando está tudo bem: caixa cheia de "ok" vira caixa ignorada.
//
// Nasceu do incidente de 30/07 (GU BigData): os dois tipos expiraram à meia-noite
// do dia do evento e o público bateu em "Vendas encerradas", sem aviso nenhum.
//
// Autenticação: header do Vercel Cron (Bearer CRON_SECRET) OU sessão de admin —
// assim dá pra abrir no navegador logado e ver o diagnóstico na hora.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { listarTipos, contarInscritosPorTipo, type TipoIngresso } from '@/lib/tipos-ingresso'
import { analisarVendas, type ProdutoVigiado } from '@/lib/vigilancia'
import { enviarAlertaVendas } from '@/lib/email/enviar'
import { hojeBRT } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function autorizado(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') === `Bearer ${secret}`) return true
  return estaLogado()
}

export async function GET(request: Request) {
  if (!(await autorizado(request))) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }

  const tipos = await listarTipos()
  const porProduto = new Map<string, TipoIngresso[]>()
  for (const t of tipos) {
    const lista = porProduto.get(t.produto_slug) ?? []
    lista.push(t)
    porProduto.set(t.produto_slug, lista)
  }

  const produtos: ProdutoVigiado[] = await Promise.all(
    [...porProduto.entries()].map(async ([slug, lista]) => ({
      slug,
      tipos: lista,
      inscritos: await contarInscritosPorTipo(slug),
    }))
  )

  const alertas = analisarVendas(produtos, hojeBRT())
  // `?seco=1` diagnostica sem mandar e-mail — útil pra conferir de dentro do admin.
  const seco = new URL(request.url).searchParams.get('seco') === '1'

  if (alertas.length === 0) {
    console.log(`Vigia de vendas: ${produtos.length} produto(s), nenhum alerta.`)
    return NextResponse.json({ ok: true, produtos: produtos.length, alertas: [], email: 'nao_enviado' })
  }

  if (seco) return NextResponse.json({ ok: true, produtos: produtos.length, alertas, email: 'seco' })

  const envio = await enviarAlertaVendas(alertas)
  if (!envio.ok) console.error('Vigia de vendas: falha ao enviar alerta —', envio.erro)
  console.log(`Vigia de vendas: ${alertas.length} alerta(s), e-mail ${envio.ok ? 'enviado' : 'FALHOU'}.`)

  return NextResponse.json({
    ok: true,
    produtos: produtos.length,
    alertas,
    email: envio.ok ? { enviado: true, id: envio.id } : { enviado: false, erro: envio.erro },
  })
}
