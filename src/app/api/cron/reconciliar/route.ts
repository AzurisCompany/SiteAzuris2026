// GET /api/cron/reconciliar
// Conciliação automática diária: puxa o estado real no Asaas das cobranças ainda
// NÃO finais (pending/overdue) e consolida no banco. Rede de segurança pra webhook
// perdido — sem isso, um pagamento cujo webhook falhou fica "pendente" pra sempre.
//
// Disparado pelo Vercel Cron (ver vercel.json). O Vercel injeta o header
// Authorization: Bearer ${CRON_SECRET} quando a env var CRON_SECRET existe.
import { NextResponse } from 'next/server'
import { sincronizarTodas } from '@/lib/asaas-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Sem secret o endpoint ficaria aberto — exige configuração explícita.
    console.error('CRON_SECRET não configurado — conciliação automática desabilitada.')
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }

  const inicio = Date.now()
  try {
    // Só os não-finais: não faz sentido re-sincronizar pago/cancelado/estornado.
    const r = await sincronizarTodas(true)
    console.log(`Conciliação: ${r.sincronizadas}/${r.total} sincronizadas, ${r.erros} erro(s) em ${Date.now() - inicio}ms`)
    return NextResponse.json({ ok: true, ...r, ms: Date.now() - inicio })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    console.error('Conciliação automática falhou:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
