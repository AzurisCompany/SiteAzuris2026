// POST /api/dssbr-2026/inscricao
// Checkout da pré-venda DSS 2026. Preço fixo (sem lote/vagas) — ver [[produtos]].
// Valida → cria customer + payment no Asaas → grava no DB → retorna { invoiceUrl }.
// O webhook /api/webhook/asaas (compartilhado, agnóstico de produto) confirma o pagamento.

import { NextResponse } from 'next/server'
import { criarInscricaoPendente, vincularAsaas, cancelarInscricao, type BillingType } from '@/lib/db'
import { createPayment, findOrCreateCustomer } from '@/lib/asaas'
import { valorParcela, totalComJuros, MAX_PARCELAS } from '@/lib/parcelamento'
import { getProduto } from '@/lib/produtos'
import { getTipo, valorCobradoDoTipo } from '@/lib/tipos-ingresso'
import { normalizarExtras, type ExtrasInput } from '@/lib/checkout-extras'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PRODUTO = getProduto('dss-2026')

interface RequestBody extends ExtrasInput {
  nome: string
  email: string
  cpf_cnpj: string
  telefone?: string
  tipo?: string // tipo de ingresso cadastrado (opcional; sem ele, usa o preço único)
  billing_type: BillingType
  installments?: number
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    content?: string
    term?: string
  }
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, '')
}

function todayPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function validate(body: RequestBody): string | null {
  if (!body.nome || body.nome.trim().length < 3) return 'Nome inválido'
  if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) return 'E-mail inválido'

  const cpf = onlyDigits(body.cpf_cnpj ?? '')
  if (cpf.length !== 11 && cpf.length !== 14) return 'CPF/CNPJ inválido (precisa 11 ou 14 dígitos)'

  const tel = onlyDigits(body.telefone ?? '')
  if (tel.length !== 10 && tel.length !== 11) return 'Telefone inválido (DDD + número, 10 ou 11 dígitos)'

  if (body.billing_type !== 'PIX' && body.billing_type !== 'CREDIT_CARD') return 'Forma de pagamento inválida'

  if (body.billing_type === 'CREDIT_CARD') {
    const n = body.installments ?? 1
    // Máximo efetivo depende do tipo — validação fina é feita no cálculo (clamp server-side).
    if (!Number.isInteger(n) || n < 1 || n > MAX_PARCELAS) return `Parcelamento inválido (1 a ${MAX_PARCELAS})`
  }

  if (body.consentimento !== true) return 'É necessário aceitar os termos de uso dos dados (LGPD)'
  return null
}

export async function POST(request: Request) {
  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const error = validate(body)
  if (error) return NextResponse.json({ error }, { status: 400 })

  // Preço SEMPRE derivado no servidor (nunca confiar no client).
  // Se veio um tipo de ingresso cadastrado, o preço/parcelas vêm dele; senão, usa o
  // preço único do registry (lib/produtos.ts). Regra de PIX/cartão idêntica — ver [[parcelamento]].
  let tipoIngresso: string | null = null
  let descricaoAsaas = PRODUTO.asaasDescricao
  let externalRef = PRODUTO.slug
  let installments: number
  let installmentValueReais: number
  let valorCobradoReais: number

  if (body.tipo) {
    const tipo = await getTipo(PRODUTO.slug, body.tipo)
    if (!tipo || !tipo.ativo) {
      return NextResponse.json({ error: 'Tipo de ingresso indisponível' }, { status: 400 })
    }
    const cobrado = valorCobradoDoTipo(tipo, body.billing_type, body.installments ?? 1)
    installments = cobrado.installments
    installmentValueReais = cobrado.installmentValueReais
    valorCobradoReais = cobrado.valorReais
    tipoIngresso = tipo.tipo_id
    descricaoAsaas = `${PRODUTO.asaasDescricao} — ${tipo.nome}`
    externalRef = `${PRODUTO.slug}:${tipo.tipo_id}`
  } else {
    const precoBaseReais = PRODUTO.precoCentavos / 100
    const precoCartaoBaseReais = Number((precoBaseReais * (1 + PRODUTO.cartaoAcrescimoPct)).toFixed(2))
    installments =
      body.billing_type === 'CREDIT_CARD' ? Math.min(Math.max(body.installments ?? 1, 1), PRODUTO.maxParcelas) : 1
    installmentValueReais = valorParcela(precoCartaoBaseReais, installments)
    valorCobradoReais =
      body.billing_type === 'PIX'
        ? Number((precoBaseReais * (1 - PRODUTO.pixDescontoPct)).toFixed(2))
        : totalComJuros(precoCartaoBaseReais, installments)
  }
  const valorCobradoCentavos = Math.round(valorCobradoReais * 100)
  const extras = normalizarExtras(body)

  // 1. Grava a inscrição como 'pending' ANTES do Asaas — lead garantido mesmo se o Asaas falhar.
  let inscricaoId: number
  try {
    const insc = await criarInscricaoPendente({
      curso_slug: PRODUTO.slug,
      lote: 'unico',
      tipo_ingresso: tipoIngresso,
      nome: body.nome.trim(),
      email: body.email.trim().toLowerCase(),
      cpf_cnpj: onlyDigits(body.cpf_cnpj),
      telefone: body.telefone ? onlyDigits(body.telefone) : null,
      billing_type: body.billing_type,
      valor_centavos: valorCobradoCentavos,
      installments,
      utm_source: body.utm?.source ?? null,
      utm_medium: body.utm?.medium ?? null,
      utm_campaign: body.utm?.campaign ?? null,
      utm_content: body.utm?.content ?? null,
      utm_term: body.utm?.term ?? null,
      ...extras,
      consentimento_lgpd: true,
      consentimento_em: new Date().toISOString(),
    })
    inscricaoId = insc.id
  } catch (e) {
    console.error('Falha ao registrar inscrição DSS no DB:', e)
    return NextResponse.json({ error: 'Falha ao registrar inscrição. Tenta de novo.' }, { status: 500 })
  }

  // 2+3. Cliente + cobrança no Asaas
  let customer
  let payment
  try {
    customer = await findOrCreateCustomer({
      name: body.nome.trim(),
      email: body.email.trim().toLowerCase(),
      cpfCnpj: onlyDigits(body.cpf_cnpj),
      mobilePhone: body.telefone ? onlyDigits(body.telefone) : null,
    })
    payment = await createPayment({
      customerId: customer.id,
      billingType: body.billing_type,
      valueReais: valorCobradoReais,
      description: descricaoAsaas,
      externalReference: externalRef,
      dueDate: todayPlusDays(3),
      installmentCount: installments > 1 ? installments : undefined,
      installmentValueReais: installments > 1 ? installmentValueReais : undefined,
    })
  } catch (e) {
    // Cobrança não saiu — cancela a inscrição pendente (mantém o lead, libera vaga).
    await cancelarInscricao(inscricaoId).catch(() => {})
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return NextResponse.json({ error: `Falha ao criar cobrança: ${msg}` }, { status: 502 })
  }

  // 4. Vincula os dados do Asaas (líquido/taxa/vencimento já na criação).
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
    invoiceUrl: payment.invoiceUrl,
    paymentId: payment.id,
    valor: valorCobradoReais,
  })
}
