// POST /api/admin/cobranca/cancelar  (protegido)
//   body { id }  → encerra de vez uma cobrança pendente/vencida.
//
// Apaga a cobrança no Asaas (o parcelamento inteiro, quando for cartão parcelado)
// e marca a inscrição como 'cancelled'. A linha NÃO some do painel — vira histórico
// com status Cancelado, o lead continua lá.
//
// Diferente de /trocar-meio, que também cancela mas gera uma nova cobrança no lugar.
// Aqui não nasce nada novo: é o fim da linha.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { getInscricao } from '@/lib/admin-queries'
import { cancelarInscricao } from '@/lib/db'
import { getPayment, deletePayment, deleteInstallment, mapAsaasStatus } from '@/lib/asaas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { id?: number }
  if (typeof body.id !== 'number' || !Number.isInteger(body.id)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  }

  const insc = await getInscricao(body.id)
  if (!insc) return NextResponse.json({ error: 'cobrança não encontrada' }, { status: 404 })
  if (insc.status === 'cancelled') {
    return NextResponse.json({ error: 'Essa cobrança já está cancelada.' }, { status: 409 })
  }
  if (insc.status !== 'pending' && insc.status !== 'overdue') {
    return NextResponse.json(
      { error: 'Só dá pra cancelar cobrança pendente ou vencida. Cobrança paga se resolve por estorno no painel do Asaas.' },
      { status: 409 }
    )
  }

  // Inscrição sem vínculo no Asaas (ex.: gratuita, ou a cobrança nunca chegou a nascer):
  // não há o que apagar lá fora, só encerrar aqui.
  if (!insc.asaas_payment_id) {
    await cancelarInscricao(insc.id)
    return NextResponse.json({ ok: true, id: insc.id, asaas: 'sem-vinculo' })
  }

  // Confere o estado real antes de apagar: o banco pode estar desatualizado e a
  // cobrança já ter sido paga (webhook perdido). Apagar uma paga seria estrago.
  let installmentId: string | null = null
  let existeNoAsaas = true
  try {
    const atual = await getPayment(insc.asaas_payment_id)
    installmentId = atual.installment ?? null
    if (atual.status && mapAsaasStatus(atual.status) === 'paid') {
      return NextResponse.json(
        { error: 'O Asaas diz que essa cobrança está PAGA. Rode o sync antes — se for estorno, faça pelo painel do Asaas.' },
        { status: 409 }
      )
    }
  } catch {
    existeNoAsaas = false // já não existe lá — segue e encerra só do nosso lado
  }

  if (existeNoAsaas) {
    try {
      if (installmentId) await deleteInstallment(installmentId)
      else await deletePayment(insc.asaas_payment_id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'erro desconhecido'
      return NextResponse.json(
        { error: `Não consegui cancelar no Asaas: ${msg}. Nada foi alterado.` },
        { status: 502 }
      )
    }
  }

  await cancelarInscricao(insc.id)

  return NextResponse.json({
    ok: true,
    id: insc.id,
    asaas: existeNoAsaas ? (installmentId ? 'parcelamento-apagado' : 'cobranca-apagada') : 'nao-existia',
  })
}
