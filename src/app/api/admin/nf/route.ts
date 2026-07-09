// POST /api/admin/nf  (protegido)
//   body { id, action: 'emitir' | 'sincronizar' | 'cancelar' }
// Emite/consulta/cancela a NFS-e de uma venda via Asaas e guarda o resultado.
// A emissão exige config fiscal preenchida NA CONTA Asaas (inscrição municipal,
// serviço, regime) — erros do Asaas são propagados pra facilitar o diagnóstico.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { getInscricao } from '@/lib/admin-queries'
import { atualizarNf, getConfigsFinanceiro } from '@/lib/db'
import { createInvoice, getInvoice, getInvoicesByPayment, cancelInvoice, type AsaasInvoice } from '@/lib/asaas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function persistir(id: number, inv: AsaasInvoice) {
  return atualizarNf(id, {
    nf_id: inv.id,
    nf_status: inv.status ?? null,
    nf_numero: inv.number ?? null,
    nf_pdf_url: inv.pdfUrl ?? null,
    nf_xml_url: inv.xmlUrl ?? null,
  })
}

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }
  let body: { id?: number; action?: string }
  try {
    body = (await request.json()) as { id?: number; action?: string }
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (!body.id || !Number.isInteger(body.id)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  }

  const insc = await getInscricao(body.id)
  if (!insc) return NextResponse.json({ error: 'venda não encontrada' }, { status: 404 })
  if (!insc.asaas_payment_id) {
    return NextResponse.json({ error: 'venda sem cobrança no Asaas' }, { status: 400 })
  }

  try {
    if (body.action === 'emitir') {
      if (insc.status !== 'paid') {
        return NextResponse.json({ error: 'Só dá pra emitir NF de venda paga' }, { status: 409 })
      }
      const cfg = await getConfigsFinanceiro()
      const serviceDescription = (cfg.nf_servico_descricao ?? '').trim()
      if (!serviceDescription) {
        return NextResponse.json(
          { error: 'Configure a descrição do serviço da NF em Financeiro antes de emitir.' },
          { status: 400 }
        )
      }
      const inv = await createInvoice({
        paymentId: insc.asaas_payment_id,
        valueReais: insc.valor_centavos / 100,
        serviceDescription,
        observations: `Ref. ${insc.nome} — pedido #${insc.id}`,
        municipalServiceCode: cfg.nf_municipal_service_code || undefined,
        municipalServiceName: cfg.nf_municipal_service_name || undefined,
      })
      await persistir(insc.id, inv)
      return NextResponse.json({ ok: true, nf: inv })
    }

    if (body.action === 'sincronizar') {
      let inv: AsaasInvoice | null = null
      if (insc.nf_id) {
        inv = await getInvoice(insc.nf_id)
      } else {
        const lista = await getInvoicesByPayment(insc.asaas_payment_id)
        inv = lista[0] ?? null
      }
      if (!inv) return NextResponse.json({ error: 'nenhuma NF encontrada pra esta cobrança' }, { status: 404 })
      await persistir(insc.id, inv)
      return NextResponse.json({ ok: true, nf: inv })
    }

    if (body.action === 'cancelar') {
      if (!insc.nf_id) return NextResponse.json({ error: 'sem NF pra cancelar' }, { status: 400 })
      const inv = await cancelInvoice(insc.nf_id)
      await persistir(insc.id, inv)
      return NextResponse.json({ ok: true, nf: inv })
    }

    return NextResponse.json({ error: 'ação inválida' }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return NextResponse.json({ error: `Asaas: ${msg}` }, { status: 502 })
  }
}
