// POST /api/admin/cobranca  (protegido)
// Gera uma cobrança MANUAL no Asaas a partir de uma proposta fechada — valor e
// descrição livres. Reusa o pipeline comum (criarCobranca). O produto escolhido
// vira o curso_slug (a aba do painel); sem produto, cai em 'proposta'. O valor é
// sempre o que o admin digitou — aqui ele é a fonte da verdade, não o registry.
// Webhook fecha o status.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { type BillingType } from '@/lib/db'
import { type AsaasBillingType } from '@/lib/asaas'
import { valorParcela, totalComJuros, valorParcelaSemJuros, MAX_PARCELAS_ADMIN } from '@/lib/parcelamento'
import { cpfCnpjValido } from '@/lib/validacao-doc'
import { onlyDigits, todayPlusDays, VALOR_MINIMO_REAIS } from '@/lib/format'
import { criarCobranca } from '@/lib/cobranca-pipeline'
import { normalizarExtras, validarExtras, enderecoParaAsaas, type ExtrasInput } from '@/lib/checkout-extras'
import {
  getOpcaoCobranca,
  ORIGEM_ADMIN,
  PREFIXO_MANUAL,
  PROPOSTA_SLUG,
  type OpcaoCobranca,
} from '@/lib/cobranca-manual'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RequestBody extends ExtrasInput {
  nome?: string
  email?: string
  cpf_cnpj?: string
  telefone?: string
  curso_slug?: string
  descricao?: string
  valor_reais?: number
  billing_type?: BillingType
  installments?: number
  com_juros?: boolean // cartão parcelado: true = juros repassados; false = sem juros (Azuris absorve)
  dias_vencimento?: number
}

function validate(b: RequestBody, opcao: OpcaoCobranca): string | null {
  if (!b.nome || b.nome.trim().length < 3) return 'Nome inválido'
  if (!b.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) return 'E-mail inválido'

  if (!cpfCnpjValido(onlyDigits(b.cpf_cnpj))) return 'CPF/CNPJ inválido (dígito verificador não confere)'

  // Endereço de PJ segue a regra do produto — igual ao checkout público dele.
  const erroExtras = validarExtras(b, {
    cpfCnpj: b.cpf_cnpj,
    enderecoObrigatorioPJ: opcao.enderecoObrigatorioPJ,
  })
  if (erroExtras) return erroExtras

  const tel = onlyDigits(b.telefone)
  if (tel.length !== 10 && tel.length !== 11) return 'Telefone inválido (DDD + número, 10 ou 11 dígitos)'

  if (!b.descricao || b.descricao.trim().length < 3) return 'Descrição inválida (o que está sendo cobrado)'

  if (typeof b.valor_reais !== 'number' || !Number.isFinite(b.valor_reais)) return 'Valor inválido'
  if (b.valor_reais < VALOR_MINIMO_REAIS) return `Valor mínimo é R$ ${VALOR_MINIMO_REAIS},00`

  const METODOS: AsaasBillingType[] = ['PIX', 'CREDIT_CARD', 'BOLETO', 'UNDEFINED']
  if (!b.billing_type || !METODOS.includes(b.billing_type as AsaasBillingType)) return 'Forma de pagamento inválida'
  if (b.billing_type === 'CREDIT_CARD') {
    const n = b.installments ?? 1
    if (!Number.isInteger(n) || n < 1 || n > MAX_PARCELAS_ADMIN)
      return `Parcelamento inválido (1 a ${MAX_PARCELAS_ADMIN})`
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

  // Produto = balde da venda. Só a allowlist entra: curso_slug vem do client.
  const opcao = getOpcaoCobranca(body.curso_slug ?? PROPOSTA_SLUG)
  if (!opcao) return NextResponse.json({ error: 'Produto inválido' }, { status: 400 })

  const error = validate(body, opcao)
  if (error) return NextResponse.json({ error }, { status: 400 })

  const billing_type = body.billing_type as AsaasBillingType
  const valorBaseReais = Number(body.valor_reais!.toFixed(2))
  const installments =
    billing_type === 'CREDIT_CARD' ? Math.min(Math.max(body.installments ?? 1, 1), MAX_PARCELAS_ADMIN) : 1
  // Cartão parcelado (2x+) pode ser COM ou SEM juros (escolha do admin). Sem juros:
  // a Azuris absorve a taxa, o total cobrado = valor base. PIX/Boleto/UNDEFINED e 1x
  // = valor cheio à vista.
  const parcelado = billing_type === 'CREDIT_CARD' && installments > 1
  const comJuros = body.com_juros !== false // default: repassa juros
  const installmentValueReais = comJuros
    ? valorParcela(valorBaseReais, installments)
    : valorParcelaSemJuros(valorBaseReais, installments)
  // Sem juros o total é o valor base; com juros soma a tabela Price.
  const valorCobradoReais = parcelado && comJuros ? totalComJuros(valorBaseReais, installments) : valorBaseReais
  const valorCobradoCentavos = Math.round(valorCobradoReais * 100)
  const descricao = body.descricao!.trim()
  const dueDays = body.dias_vencimento ?? 3

  const cpf = onlyDigits(body.cpf_cnpj)
  const nome = body.nome!.trim()
  const email = body.email!.trim().toLowerCase()
  const telefone = onlyDigits(body.telefone)
  const extras = normalizarExtras(body, cpf)
  const endereco = enderecoParaAsaas(extras.nf_endereco)

  const resultado = await criarCobranca({
    dedupe: { curso_slug: opcao.slug, cpf_cnpj: cpf, valor_centavos: valorCobradoCentavos },
    inscricao: {
      curso_slug: opcao.slug,
      // Cobrança manual não é venda de lote: fica fora da contagem de vagas do
      // Lakehouse (v_vagas_por_lote conta lote1/lote2).
      lote: 'unico',
      nome,
      email,
      cpf_cnpj: cpf,
      telefone,
      billing_type,
      valor_centavos: valorCobradoCentavos,
      installments,
      // Carimbo de origem: é o que identifica a venda como nascida no admin agora
      // que ela pode cair em qualquer balde de produto.
      utm_source: ORIGEM_ADMIN,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      ...extras,
      // guarda a descrição digitada aqui — sem campo dedicado (visível no detalhe).
      como_conheceu: `${PREFIXO_MANUAL}${descricao}`,
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
      billingType: billing_type,
      valueReais: valorCobradoReais,
      description: descricao,
      externalReference: (id) => `${opcao.slug}:${id}`,
      dueDate: todayPlusDays(dueDays),
      installmentCount: parcelado ? installments : undefined,
      // Com juros: parcela pré-fixada (Price). Sem juros: manda o total, Asaas divide.
      installmentValueReais: parcelado && comJuros ? installmentValueReais : undefined,
      installmentTotalReais: parcelado && !comJuros ? valorBaseReais : undefined,
    },
  })

  if (resultado.tipo === 'duplicada') {
    const d = resultado.inscricao
    return NextResponse.json({
      ok: true,
      id: d.id,
      invoiceUrl: d.asaas_invoice_url,
      paymentId: d.asaas_payment_id,
      valor: d.valor_centavos / 100,
      installments: d.installments,
      installmentValue:
        d.installments > 1 ? Number((d.valor_centavos / 100 / d.installments).toFixed(2)) : d.valor_centavos / 100,
      billing_type: d.billing_type,
      duplicada: true,
    })
  }
  if (resultado.tipo === 'erro_db') {
    return NextResponse.json({ error: 'Falha ao registrar a cobrança. Tenta de novo.' }, { status: 500 })
  }
  if (resultado.tipo === 'erro_asaas') {
    return NextResponse.json({ error: `Falha ao criar cobrança: ${resultado.mensagem}` }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    id: resultado.inscricaoId,
    invoiceUrl: resultado.payment.invoiceUrl,
    paymentId: resultado.payment.id,
    valor: valorCobradoReais,
    installments,
    installmentValue: installments > 1 ? installmentValueReais : valorCobradoReais,
    com_juros: parcelado ? comJuros : true,
    billing_type,
  })
}
