// POST /api/inscricao
// Recebe dados do form, valida, cria customer + payment no Asaas, salva no DB.
// Retorna { invoiceUrl } pra o cliente redirecionar pro checkout.

import { NextResponse } from 'next/server'
import {
  criarInscricaoPendente,
  vincularAsaas,
  cancelarInscricao,
  determinarLotePorPerfil,
  normalizarPerfil,
  buscarCobrancaDuplicada,
  type BillingType,
} from '@/lib/db'
import { createPayment, findOrCreateCustomer } from '@/lib/asaas'
import { MAX_PARCELAS, valorParcela, totalComJuros } from '@/lib/parcelamento'
import { normalizarExtras, type ExtrasInput } from '@/lib/checkout-extras'
import { cpfCnpjValido } from '@/lib/validacao-doc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RequestBody extends ExtrasInput {
  nome: string
  email: string
  cpf_cnpj: string
  telefone?: string
  perfil?: string
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
  if (!cpfCnpjValido(cpf)) return 'CPF/CNPJ inválido (dígito verificador não confere)'

  const tel = onlyDigits(body.telefone ?? '')
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

  // Preço por perfil auto-declarado (membro GU/DSSBR → R$550 / não-membro → R$750).
  // Derivado 100% no servidor — o cliente só informa qual perfil, nunca o valor.
  const perfil = normalizarPerfil(body.perfil)
  const { lote, vagasRestantes, preco_centavos: precoBaseCentavos } = await determinarLotePorPerfil(perfil)
  if (vagasRestantes <= 0) {
    return NextResponse.json(
      { error: 'Não há mais vagas neste perfil no momento. Entre em contato pra fila de espera.' },
      { status: 409 }
    )
  }

  // Calcula valor cobrado conforme forma de pagamento.
  // PIX: 5% off, à vista. Cartão: 1x à vista (valor cheio) ou 2x–5x com juros
  // embutidos (repassados ao cliente). O checkout do Asaas não mostra seletor de
  // parcelas numa cobrança avulsa, então fixamos installmentCount + installmentValue
  // (com o juro já dentro) — ver [[parcelamento]].
  const installments =
    body.billing_type === 'CREDIT_CARD' ? Math.min(Math.max(body.installments ?? 1, 1), MAX_PARCELAS) : 1
  const precoBaseReais = precoBaseCentavos / 100
  const installmentValueReais = valorParcela(precoBaseReais, installments)
  const valorCobradoReais =
    body.billing_type === 'PIX'
      ? Math.round(precoBaseCentavos * 0.95) / 100
      : totalComJuros(precoBaseReais, installments)
  const valorCobradoCentavos = Math.round(valorCobradoReais * 100)
  const extras = normalizarExtras(body)

  // Anti-duplicação: se já há fatura idêntica recente (mesmo doc/valor/perfil), devolve ela
  // — evita 2ª cobrança E 2ª reserva de vaga no submit duplicado.
  const duplicada = await buscarCobrancaDuplicada({
    curso_slug: 'lakehouse-comunidade',
    cpf_cnpj: onlyDigits(body.cpf_cnpj),
    valor_centavos: valorCobradoCentavos,
    tipo_ingresso: perfil,
  })
  if (duplicada?.asaas_invoice_url) {
    return NextResponse.json({
      ok: true,
      invoiceUrl: duplicada.asaas_invoice_url,
      paymentId: duplicada.asaas_payment_id,
      valor: duplicada.valor_centavos / 100,
      lote,
      duplicada: true,
    })
  }

  // 1. Grava a inscrição como 'pending' ANTES do Asaas (reserva a vaga + lead garantido).
  let inscricaoId: number
  try {
    const insc = await criarInscricaoPendente({
      curso_slug: 'lakehouse-comunidade',
      lote,
      tipo_ingresso: perfil, // 'membro' | 'nao-membro' — abre o breakdown por tipo no admin
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
    console.error('Falha ao registrar inscrição no DB:', e)
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
      description: `Lakehouse: Pipeline na Prática — ${lote === 'lote1' ? 'Lote 1' : 'Lote 2'}`,
      externalReference: `lakehouse-comunidade:${lote}`,
      dueDate: todayPlusDays(3),
      installmentCount: installments > 1 ? installments : undefined,
      installmentValueReais: installments > 1 ? installmentValueReais : undefined,
    })
  } catch (e) {
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
    lote,
  })
}
