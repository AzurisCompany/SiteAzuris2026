// POST /api/admin/cobranca/atualizar  (protegido)
// Edita uma cobrança PENDENTE/VENCIDA no Asaas: novo vencimento e/ou valor.
// Depois reconcilia os valores (líquido/taxa) no banco a partir da resposta.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { getInscricao } from '@/lib/admin-queries'
import { atualizarCobrancaEditada } from '@/lib/db'
import { updatePayment } from '@/lib/asaas'
import { VALOR_MINIMO_REAIS, hojeBRT } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  id?: number
  due_date?: string // YYYY-MM-DD
  valor_reais?: number
}

function dataValida(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00`)
  return !Number.isNaN(d.getTime())
}

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.id || !Number.isInteger(body.id)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  }
  if (body.due_date == null && body.valor_reais == null) {
    return NextResponse.json({ error: 'Informe novo vencimento e/ou valor' }, { status: 400 })
  }

  const insc = await getInscricao(body.id)
  if (!insc) return NextResponse.json({ error: 'cobrança não encontrada' }, { status: 404 })
  if (!insc.asaas_payment_id) {
    return NextResponse.json({ error: 'cobrança sem vínculo no Asaas' }, { status: 400 })
  }
  if (insc.status !== 'pending' && insc.status !== 'overdue') {
    return NextResponse.json({ error: 'Só dá pra editar cobrança pendente ou vencida' }, { status: 409 })
  }

  // Validações dos campos enviados.
  if (body.due_date != null) {
    if (!dataValida(body.due_date)) return NextResponse.json({ error: 'Vencimento inválido' }, { status: 400 })
    if (body.due_date < hojeBRT()) return NextResponse.json({ error: 'Vencimento não pode ser no passado' }, { status: 400 })
  }

  let valorReais: number | undefined
  if (body.valor_reais != null) {
    if (insc.installments > 1) {
      return NextResponse.json(
        { error: 'Não dá pra editar o valor de uma cobrança parcelada. Cancele e gere de novo.' },
        { status: 409 }
      )
    }
    if (typeof body.valor_reais !== 'number' || !Number.isFinite(body.valor_reais) || body.valor_reais < VALOR_MINIMO_REAIS) {
      return NextResponse.json({ error: `Valor mínimo é R$ ${VALOR_MINIMO_REAIS},00` }, { status: 400 })
    }
    valorReais = Number(body.valor_reais.toFixed(2))
  }

  // Atualiza no Asaas.
  let payment
  try {
    payment = await updatePayment(insc.asaas_payment_id, {
      valueReais: valorReais,
      dueDate: body.due_date ?? undefined,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return NextResponse.json({ error: `Falha ao atualizar no Asaas: ${msg}` }, { status: 502 })
  }

  // Reconcilia os valores no banco a partir da resposta.
  const bruto = typeof payment.value === 'number' ? Math.round(payment.value * 100) : insc.valor_centavos
  const liquido = typeof payment.netValue === 'number' ? Math.round(payment.netValue * 100) : insc.valor_liquido_centavos
  const taxa = bruto != null && liquido != null ? bruto - liquido : insc.taxa_centavos
  await atualizarCobrancaEditada(insc.id, {
    valor_centavos: bruto,
    valor_liquido_centavos: liquido,
    taxa_centavos: taxa,
    due_date: payment.dueDate ?? body.due_date ?? insc.due_date,
  })

  return NextResponse.json({
    ok: true,
    id: insc.id,
    valor: bruto / 100,
    due_date: payment.dueDate ?? body.due_date ?? insc.due_date,
    invoiceUrl: payment.invoiceUrl ?? insc.asaas_invoice_url,
  })
}
