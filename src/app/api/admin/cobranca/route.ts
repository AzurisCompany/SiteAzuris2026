// POST /api/admin/cobranca  (protegido)
// Gera uma cobrança AVULSA no Asaas a partir de uma proposta fechada — valor e
// descrição livres. Reusa o mesmo pipeline do checkout (customer → payment →
// inscrição pending → vínculo Asaas). O webhook compartilhado fecha o status.
// A inscrição fica com curso_slug='proposta' pra virar um balde próprio no admin.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { criarInscricaoPendente, vincularAsaas, cancelarInscricao, type BillingType } from '@/lib/db'
import { createPayment, findOrCreateCustomer } from '@/lib/asaas'
import { valorParcela, totalComJuros, MAX_PARCELAS } from '@/lib/parcelamento'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Slug interno das cobranças avulsas (aparece como "Proposta customizada" no admin). */
export const PROPOSTA_SLUG = 'proposta'
/** Piso de valor (R$) — evita cobrança quebrada e respeita mínimos do Asaas. */
const VALOR_MINIMO_REAIS = 5

interface RequestBody {
  nome?: string
  email?: string
  cpf_cnpj?: string
  telefone?: string
  descricao?: string
  valor_reais?: number
  billing_type?: BillingType
  installments?: number
  dias_vencimento?: number
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, '')
}

function todayPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function validate(b: RequestBody): string | null {
  if (!b.nome || b.nome.trim().length < 3) return 'Nome inválido'
  if (!b.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) return 'E-mail inválido'

  const cpf = onlyDigits(b.cpf_cnpj ?? '')
  if (cpf.length !== 11 && cpf.length !== 14) return 'CPF/CNPJ inválido (precisa 11 ou 14 dígitos)'

  const tel = onlyDigits(b.telefone ?? '')
  if (tel.length !== 10 && tel.length !== 11) return 'Telefone inválido (DDD + número, 10 ou 11 dígitos)'

  if (!b.descricao || b.descricao.trim().length < 3) return 'Descrição inválida (o que está sendo cobrado)'

  if (typeof b.valor_reais !== 'number' || !Number.isFinite(b.valor_reais)) return 'Valor inválido'
  if (b.valor_reais < VALOR_MINIMO_REAIS) return `Valor mínimo é R$ ${VALOR_MINIMO_REAIS},00`

  if (b.billing_type !== 'PIX' && b.billing_type !== 'CREDIT_CARD') return 'Forma de pagamento inválida'
  if (b.billing_type === 'CREDIT_CARD') {
    const n = b.installments ?? 1
    if (!Number.isInteger(n) || n < 1 || n > MAX_PARCELAS) return `Parcelamento inválido (1 a ${MAX_PARCELAS})`
  }

  if (b.dias_vencimento != null) {
    const dv = b.dias_vencimento
    if (!Number.isInteger(dv) || dv < 1 || dv > 60) return 'Vencimento inválido (1 a 60 dias)'
  }
  return null
}

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const error = validate(body)
  if (error) return NextResponse.json({ error }, { status: 400 })

  const billing_type = body.billing_type as BillingType
  const valorBaseReais = Number(body.valor_reais!.toFixed(2))
  const installments =
    billing_type === 'CREDIT_CARD' ? Math.min(Math.max(body.installments ?? 1, 1), MAX_PARCELAS) : 1
  // PIX / 1x = valor cheio; 2x+ = juros repassados (mesma regra do site).
  const installmentValueReais = valorParcela(valorBaseReais, installments)
  const valorCobradoReais = billing_type === 'PIX' ? valorBaseReais : totalComJuros(valorBaseReais, installments)
  const valorCobradoCentavos = Math.round(valorCobradoReais * 100)
  const descricao = body.descricao!.trim()
  const dueDays = body.dias_vencimento ?? 3

  // 1. Inscrição 'pending' antes do Asaas — lead garantido mesmo se a cobrança falhar.
  let inscricaoId: number
  try {
    const insc = await criarInscricaoPendente({
      curso_slug: PROPOSTA_SLUG,
      lote: 'unico',
      nome: body.nome!.trim(),
      email: body.email!.trim().toLowerCase(),
      cpf_cnpj: onlyDigits(body.cpf_cnpj!),
      telefone: onlyDigits(body.telefone!),
      billing_type,
      valor_centavos: valorCobradoCentavos,
      installments,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      empresa: null,
      cargo: null,
      pessoa_tipo: onlyDigits(body.cpf_cnpj!).length === 14 ? 'PJ' : 'PF',
      razao_social: null,
      nf_endereco: null,
      // guarda a descrição da proposta aqui — some campo dedicado (visível no detalhe).
      como_conheceu: `Proposta customizada: ${descricao}`,
      consentimento_lgpd: true,
      consentimento_em: new Date().toISOString(),
    })
    inscricaoId = insc.id
  } catch (e) {
    console.error('Falha ao registrar cobrança avulsa no DB:', e)
    return NextResponse.json({ error: 'Falha ao registrar a cobrança. Tenta de novo.' }, { status: 500 })
  }

  // 2+3. Cliente + cobrança no Asaas.
  let customer
  let payment
  try {
    customer = await findOrCreateCustomer({
      name: body.nome!.trim(),
      email: body.email!.trim().toLowerCase(),
      cpfCnpj: onlyDigits(body.cpf_cnpj!),
      mobilePhone: onlyDigits(body.telefone!),
    })
    payment = await createPayment({
      customerId: customer.id,
      billingType: billing_type,
      valueReais: valorCobradoReais,
      description: descricao,
      externalReference: `${PROPOSTA_SLUG}:${inscricaoId}`,
      dueDate: todayPlusDays(dueDays),
      installmentCount: installments > 1 ? installments : undefined,
      installmentValueReais: installments > 1 ? installmentValueReais : undefined,
    })
  } catch (e) {
    await cancelarInscricao(inscricaoId).catch(() => {})
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return NextResponse.json({ error: `Falha ao criar cobrança: ${msg}` }, { status: 502 })
  }

  // 4. Vincula os dados do Asaas (líquido/taxa/vencimento).
  try {
    const bruto = typeof payment.value === 'number' ? Math.round(payment.value * 100) : null
    const liquido = typeof payment.netValue === 'number' ? Math.round(payment.netValue * 100) : null
    await vincularAsaas(inscricaoId, {
      asaas_customer_id: customer.id,
      asaas_payment_id: payment.id,
      asaas_invoice_url: payment.invoiceUrl,
      valor_liquido_centavos: liquido,
      taxa_centavos: bruto != null && liquido != null ? bruto - liquido : null,
      due_date: payment.dueDate ?? null,
      asaas_status: payment.status ?? null,
    })
  } catch (e) {
    console.error('Cobrança criada mas falha ao vincular Asaas (webhook/sync corrige):', e)
  }

  return NextResponse.json({
    ok: true,
    id: inscricaoId,
    invoiceUrl: payment.invoiceUrl,
    paymentId: payment.id,
    valor: valorCobradoReais,
    installments,
    installmentValue: installments > 1 ? installmentValueReais : valorCobradoReais,
    billing_type,
  })
}
