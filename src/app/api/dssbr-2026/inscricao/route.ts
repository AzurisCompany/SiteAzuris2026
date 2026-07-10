// POST /api/dssbr-2026/inscricao
// Checkout da pré-venda DSS 2026. Preço fixo (sem lote/vagas) — ver [[produtos]].
// Valida → deriva preço no servidor → criarCobranca (pipeline comum) → { invoiceUrl }.
// O webhook /api/webhook/asaas (compartilhado) confirma o pagamento.

import { NextResponse } from 'next/server'
import { type BillingType } from '@/lib/db'
import { cpfCnpjValido } from '@/lib/validacao-doc'
import { onlyDigits, todayPlusDays } from '@/lib/format'
import { criarCobranca } from '@/lib/cobranca-pipeline'
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

function validate(body: RequestBody): string | null {
  if (!body.nome || body.nome.trim().length < 3) return 'Nome inválido'
  if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) return 'E-mail inválido'

  if (!cpfCnpjValido(onlyDigits(body.cpf_cnpj))) return 'CPF/CNPJ inválido (dígito verificador não confere)'

  const tel = onlyDigits(body.telefone)
  if (tel.length !== 10 && tel.length !== 11) return 'Telefone inválido (DDD + número, 10 ou 11 dígitos)'

  if (body.billing_type !== 'PIX' && body.billing_type !== 'CREDIT_CARD') return 'Forma de pagamento inválida'
  if (body.billing_type === 'CREDIT_CARD') {
    const n = body.installments ?? 1
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

  // O checkout DSSBR só aceita PIX/cartão (validate garante). Estreita pro cálculo.
  const billing: 'PIX' | 'CREDIT_CARD' = body.billing_type === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX'

  // Preço SEMPRE derivado no servidor. Com tipo de ingresso cadastrado → preço/parcelas
  // vêm dele; senão, preço único do registry. Regra PIX/cartão idêntica — ver [[parcelamento]].
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
    const cobrado = valorCobradoDoTipo(tipo, billing, body.installments ?? 1)
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

  const cpf = onlyDigits(body.cpf_cnpj)
  const nome = body.nome.trim()
  const email = body.email.trim().toLowerCase()
  const telefone = body.telefone ? onlyDigits(body.telefone) : null

  const resultado = await criarCobranca({
    dedupe: { curso_slug: PRODUTO.slug, cpf_cnpj: cpf, valor_centavos: valorCobradoCentavos, tipo_ingresso: tipoIngresso },
    inscricao: {
      curso_slug: PRODUTO.slug,
      lote: 'unico',
      tipo_ingresso: tipoIngresso,
      nome,
      email,
      cpf_cnpj: cpf,
      telefone,
      billing_type: body.billing_type,
      valor_centavos: valorCobradoCentavos,
      installments,
      utm_source: body.utm?.source ?? null,
      utm_medium: body.utm?.medium ?? null,
      utm_campaign: body.utm?.campaign ?? null,
      utm_content: body.utm?.content ?? null,
      utm_term: body.utm?.term ?? null,
      ...normalizarExtras(body),
      consentimento_lgpd: true,
      consentimento_em: new Date().toISOString(),
    },
    customer: { name: nome, email, cpfCnpj: cpf, mobilePhone: telefone },
    asaas: {
      billingType: body.billing_type,
      valueReais: valorCobradoReais,
      description: descricaoAsaas,
      externalReference: externalRef,
      dueDate: todayPlusDays(3),
      installmentCount: installments > 1 ? installments : undefined,
      installmentValueReais: installments > 1 ? installmentValueReais : undefined,
    },
  })

  if (resultado.tipo === 'duplicada') {
    const d = resultado.inscricao
    return NextResponse.json({ ok: true, invoiceUrl: d.asaas_invoice_url, paymentId: d.asaas_payment_id, valor: d.valor_centavos / 100, duplicada: true })
  }
  if (resultado.tipo === 'erro_db') {
    return NextResponse.json({ error: 'Falha ao registrar inscrição. Tenta de novo.' }, { status: 500 })
  }
  if (resultado.tipo === 'erro_asaas') {
    return NextResponse.json({ error: `Falha ao criar cobrança: ${resultado.mensagem}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true, invoiceUrl: resultado.payment.invoiceUrl, paymentId: resultado.payment.id, valor: valorCobradoReais })
}
