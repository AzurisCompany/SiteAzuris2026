// POST /api/inscricao
// Checkout do Lakehouse. Valida → deriva preço no servidor → criarCobranca (pipeline
// comum: dedupe → pending → Asaas → vínculo) → responde com a invoiceUrl.

import { NextResponse } from 'next/server'
import { determinarLotePorPerfil, normalizarPerfil, type BillingType } from '@/lib/db'
import { MAX_PARCELAS, valorParcela, totalComJuros } from '@/lib/parcelamento'
import { normalizarExtras, validarExtras, enderecoParaAsaas, type ExtrasInput } from '@/lib/checkout-extras'
import { cpfCnpjValido } from '@/lib/validacao-doc'
import { onlyDigits, todayPlusDays } from '@/lib/format'
import { criarCobranca } from '@/lib/cobranca-pipeline'

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

  // Curso vendido pra empresa quase sempre vira nota — PJ não fecha sem endereço.
  // (O Lakehouse tem checkout próprio e não passa pelo registry de [[produtos]].)
  return validarExtras(body, { cpfCnpj: body.cpf_cnpj, enderecoObrigatorioPJ: true })
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

  // PIX: 5% off à vista. Cartão: 1x cheio ou 2x–5x com juros embutidos — ver [[parcelamento]].
  const installments =
    body.billing_type === 'CREDIT_CARD' ? Math.min(Math.max(body.installments ?? 1, 1), MAX_PARCELAS) : 1
  const precoBaseReais = precoBaseCentavos / 100
  const installmentValueReais = valorParcela(precoBaseReais, installments)
  const valorCobradoReais =
    body.billing_type === 'PIX'
      ? Math.round(precoBaseCentavos * 0.95) / 100
      : totalComJuros(precoBaseReais, installments)
  const valorCobradoCentavos = Math.round(valorCobradoReais * 100)

  const cpf = onlyDigits(body.cpf_cnpj)
  const nome = body.nome.trim()
  const email = body.email.trim().toLowerCase()
  const telefone = body.telefone ? onlyDigits(body.telefone) : null
  const extras = normalizarExtras(body, cpf)
  const endereco = enderecoParaAsaas(extras.nf_endereco)

  const resultado = await criarCobranca({
    dedupe: { curso_slug: 'lakehouse-comunidade', cpf_cnpj: cpf, valor_centavos: valorCobradoCentavos, tipo_ingresso: perfil },
    inscricao: {
      curso_slug: 'lakehouse-comunidade',
      lote,
      tipo_ingresso: perfil, // 'membro' | 'nao-membro' — abre o breakdown por tipo no admin
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
      ...extras,
      consentimento_lgpd: true,
      consentimento_em: new Date().toISOString(),
    },
    // Tomador da nota = dono do documento: PJ entra pela razão social.
    customer: {
      name: extras.pessoa_tipo === 'PJ' && extras.razao_social ? extras.razao_social : nome,
      email,
      cpfCnpj: cpf,
      mobilePhone: telefone,
      company: extras.razao_social,
      ...(endereco ?? {}),
    },
    asaas: {
      billingType: body.billing_type === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX',
      valueReais: valorCobradoReais,
      description: `Lakehouse: Pipeline na Prática — ${lote === 'lote1' ? 'Lote 1' : 'Lote 2'}`,
      externalReference: `lakehouse-comunidade:${lote}`,
      dueDate: todayPlusDays(3),
      installmentCount: installments > 1 ? installments : undefined,
      installmentValueReais: installments > 1 ? installmentValueReais : undefined,
    },
  })

  if (resultado.tipo === 'duplicada') {
    const d = resultado.inscricao
    return NextResponse.json({ ok: true, invoiceUrl: d.asaas_invoice_url, paymentId: d.asaas_payment_id, valor: d.valor_centavos / 100, lote, duplicada: true })
  }
  if (resultado.tipo === 'erro_db') {
    return NextResponse.json({ error: 'Falha ao registrar inscrição. Tenta de novo.' }, { status: 500 })
  }
  if (resultado.tipo === 'erro_asaas') {
    return NextResponse.json({ error: `Falha ao criar cobrança: ${resultado.mensagem}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true, invoiceUrl: resultado.payment.invoiceUrl, paymentId: resultado.payment.id, valor: valorCobradoReais, lote })
}
