// POST /api/admin/cobranca/trocar-meio  (protegido)
// Troca o MEIO de pagamento de uma cobrança pendente/vencida: cancela a cobrança
// atual no Asaas (payment ou parcelamento inteiro) e gera uma nova com o meio
// escolhido, mantendo o mesmo lead (a inscrição é re-vinculada, não duplicada).
//
// Motivação: o Asaas não deixa "converter" PIX↔cartão numa cobrança existente —
// e cartão parcelado vira N cobranças. O caminho robusto é cancelar + regerar.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { getInscricao, labelProduto } from '@/lib/admin-queries'
import { descricaoManual, PREFIXO_MANUAL } from '@/lib/cobranca-manual'
import { trocarMeioCobranca, cancelarInscricao, type BillingType } from '@/lib/db'
import {
  getPayment,
  deletePayment,
  deleteInstallment,
  findOrCreateCustomer,
  createPayment,
  type AsaasBillingType,
} from '@/lib/asaas'
import { valorParcela, totalComJuros, MAX_PARCELAS } from '@/lib/parcelamento'
import { VALOR_MINIMO_REAIS, hojeBRT, todayPlusDays } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  id?: number
  billing_type?: BillingType
  installments?: number
  valor_reais?: number // valor base (à vista); juros do cartão são somados por cima
  descricao?: string // texto que o cliente vê na fatura; vazio = mantém o atual
}

/** Descrição da fatura tem limite prático no Asaas — corta antes de mandar. */
const MAX_DESCRICAO = 500

const METODOS: BillingType[] = ['PIX', 'CREDIT_CARD', 'BOLETO', 'UNDEFINED']

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
  if (!body.billing_type || !METODOS.includes(body.billing_type)) {
    return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 })
  }
  const billing_type = body.billing_type
  const installments =
    billing_type === 'CREDIT_CARD' ? Math.min(Math.max(body.installments ?? 1, 1), MAX_PARCELAS) : 1
  if (billing_type === 'CREDIT_CARD' && (!Number.isInteger(installments) || installments < 1)) {
    return NextResponse.json({ error: `Parcelamento inválido (1 a ${MAX_PARCELAS})` }, { status: 400 })
  }

  const insc = await getInscricao(body.id)
  if (!insc) return NextResponse.json({ error: 'cobrança não encontrada' }, { status: 404 })
  if (!insc.asaas_payment_id) {
    return NextResponse.json({ error: 'cobrança sem vínculo no Asaas' }, { status: 400 })
  }
  if (insc.status !== 'pending' && insc.status !== 'overdue') {
    return NextResponse.json({ error: 'Só dá pra trocar o meio de uma cobrança pendente ou vencida' }, { status: 409 })
  }

  // Valor base: o informado, senão o valor atual (bruto) da cobrança.
  const valorBaseReais =
    body.valor_reais != null ? Number(body.valor_reais.toFixed(2)) : insc.valor_centavos / 100
  if (!Number.isFinite(valorBaseReais) || valorBaseReais < VALOR_MINIMO_REAIS) {
    return NextResponse.json({ error: `Valor mínimo é R$ ${VALOR_MINIMO_REAIS},00` }, { status: 400 })
  }

  // Juros só no cartão parcelado (2x+). PIX/Boleto/UNDEFINED = valor base à vista.
  const installmentValueReais = valorParcela(valorBaseReais, installments)
  const valorCobradoReais = billing_type === 'CREDIT_CARD' ? totalComJuros(valorBaseReais, installments) : valorBaseReais
  const valorCobradoCentavos = Math.round(valorCobradoReais * 100)

  // Cobrança manual guarda a descrição digitada; venda do site herda o nome do produto.
  const descricaoAtual = descricaoManual(insc.como_conheceu) || labelProduto(insc.curso_slug)
  const descricaoNova = (body.descricao ?? '').trim().slice(0, MAX_DESCRICAO)
  const descricao = descricaoNova || descricaoAtual

  // Nada mudou? evita cancelar+regerar à toa (e gerar link novo sem motivo).
  if (
    billing_type === insc.billing_type &&
    installments === insc.installments &&
    valorCobradoCentavos === insc.valor_centavos &&
    descricao === descricaoAtual
  ) {
    return NextResponse.json({ error: 'Nada mudou — escolha outro meio, parcelas, valor ou descrição.' }, { status: 400 })
  }

  // Vencimento: mantém o atual se ainda for futuro; senão, 3 dias a partir de hoje.
  const dueDate = insc.due_date && insc.due_date >= hojeBRT() ? insc.due_date : todayPlusDays(3)

  // 1) Cancela a cobrança anterior no Asaas. Se ela não existir mais (getPayment 404),
  //    não há o que apagar. Se existir e o DELETE falhar, ABORTA sem mexer no banco —
  //    não podemos deixar duas cobranças ativas.
  let precisaDeletar = true
  let installmentId: string | null = null
  try {
    const old = await getPayment(insc.asaas_payment_id)
    installmentId = old.installment ?? null
  } catch {
    precisaDeletar = false // provavelmente já não existe no Asaas
  }
  if (precisaDeletar) {
    try {
      if (installmentId) await deleteInstallment(installmentId)
      else await deletePayment(insc.asaas_payment_id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'erro desconhecido'
      return NextResponse.json(
        { error: `Não consegui cancelar a cobrança anterior no Asaas: ${msg}. Nada foi alterado.` },
        { status: 502 }
      )
    }
  }

  // 2) Cria a nova cobrança. A anterior já foi cancelada; se esta falhar, a inscrição
  //    fica sem cobrança ativa → marca 'cancelled' (preserva o lead) e avisa.
  let customerId = insc.asaas_customer_id
  let payment
  try {
    if (!customerId) {
      const c = await findOrCreateCustomer({
        name: insc.nome,
        email: insc.email,
        cpfCnpj: insc.cpf_cnpj,
        mobilePhone: insc.telefone,
      })
      customerId = c.id
    }
    payment = await createPayment({
      customerId,
      billingType: billing_type as AsaasBillingType,
      valueReais: valorCobradoReais,
      description: descricao,
      externalReference: `${insc.curso_slug}:${insc.id}`,
      dueDate,
      installmentCount: installments > 1 ? installments : undefined,
      installmentValueReais: installments > 1 ? installmentValueReais : undefined,
    })
  } catch (e) {
    await cancelarInscricao(insc.id).catch(() => {})
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return NextResponse.json(
      { error: `Cobrança anterior cancelada, mas a nova falhou: ${msg}. A inscrição ficou cancelada — gere de novo pela Cobrança avulsa.` },
      { status: 502 }
    )
  }

  // 3) Re-vincula a inscrição à nova cobrança.
  const bruto = typeof payment.value === 'number' ? Math.round(payment.value * 100) : valorCobradoCentavos
  const liquido = typeof payment.netValue === 'number' ? Math.round(payment.netValue * 100) : null
  // Descrição só persiste em venda manual — lá `como_conheceu` É a descrição.
  // Em venda do site aquela coluna guarda a resposta do "como conheceu": sobrescrever
  // apagaria o dado. Nessas, a descrição nova vale pra fatura gerada agora.
  const ehManual = descricaoManual(insc.como_conheceu) != null
  await trocarMeioCobranca(insc.id, {
    como_conheceu: ehManual && descricao !== descricaoAtual ? PREFIXO_MANUAL + descricao : null,
    billing_type,
    installments,
    valor_centavos: bruto,
    asaas_customer_id: customerId,
    asaas_payment_id: payment.id,
    asaas_invoice_url: payment.invoiceUrl,
    valor_liquido_centavos: liquido,
    taxa_centavos: liquido != null ? bruto - liquido : null,
    due_date: payment.dueDate ?? dueDate,
    asaas_status: payment.status ?? null,
  })

  return NextResponse.json({
    ok: true,
    id: insc.id,
    invoiceUrl: payment.invoiceUrl,
    paymentId: payment.id,
    valor: valorCobradoReais,
    installments,
    installmentValue: installments > 1 ? installmentValueReais : valorCobradoReais,
    billing_type,
    due_date: payment.dueDate ?? dueDate,
  })
}
