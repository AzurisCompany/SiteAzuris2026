// POST /api/admin/cobranca  (protegido)
// Gera uma cobrança AVULSA no Asaas a partir de uma proposta fechada — valor e
// descrição livres. Reusa o pipeline comum (criarCobranca). A inscrição fica com
// curso_slug='proposta' pra virar um balde próprio no admin. Webhook fecha o status.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { type BillingType } from '@/lib/db'
import { valorParcela, totalComJuros, MAX_PARCELAS } from '@/lib/parcelamento'
import { cpfCnpjValido } from '@/lib/validacao-doc'
import { onlyDigits, todayPlusDays, VALOR_MINIMO_REAIS } from '@/lib/format'
import { criarCobranca } from '@/lib/cobranca-pipeline'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Slug interno das cobranças avulsas (aparece como "Proposta customizada" no admin). */
export const PROPOSTA_SLUG = 'proposta'

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

function validate(b: RequestBody): string | null {
  if (!b.nome || b.nome.trim().length < 3) return 'Nome inválido'
  if (!b.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) return 'E-mail inválido'

  if (!cpfCnpjValido(onlyDigits(b.cpf_cnpj))) return 'CPF/CNPJ inválido (dígito verificador não confere)'

  const tel = onlyDigits(b.telefone)
  if (tel.length !== 10 && tel.length !== 11) return 'Telefone inválido (DDD + número, 10 ou 11 dígitos)'

  if (!b.descricao || b.descricao.trim().length < 3) return 'Descrição inválida (o que está sendo cobrado)'

  if (typeof b.valor_reais !== 'number' || !Number.isFinite(b.valor_reais)) return 'Valor inválido'
  if (b.valor_reais < VALOR_MINIMO_REAIS) return `Valor mínimo é R$ ${VALOR_MINIMO_REAIS},00`

  const METODOS: BillingType[] = ['PIX', 'CREDIT_CARD', 'BOLETO', 'UNDEFINED']
  if (!b.billing_type || !METODOS.includes(b.billing_type)) return 'Forma de pagamento inválida'
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
  // Juros só no cartão parcelado (2x+). PIX/Boleto/UNDEFINED = valor cheio à vista.
  const installmentValueReais = valorParcela(valorBaseReais, installments)
  const valorCobradoReais = billing_type === 'CREDIT_CARD' ? totalComJuros(valorBaseReais, installments) : valorBaseReais
  const valorCobradoCentavos = Math.round(valorCobradoReais * 100)
  const descricao = body.descricao!.trim()
  const dueDays = body.dias_vencimento ?? 3

  const cpf = onlyDigits(body.cpf_cnpj)
  const nome = body.nome!.trim()
  const email = body.email!.trim().toLowerCase()
  const telefone = onlyDigits(body.telefone)

  const resultado = await criarCobranca({
    dedupe: { curso_slug: PROPOSTA_SLUG, cpf_cnpj: cpf, valor_centavos: valorCobradoCentavos },
    inscricao: {
      curso_slug: PROPOSTA_SLUG,
      lote: 'unico',
      nome,
      email,
      cpf_cnpj: cpf,
      telefone,
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
      pessoa_tipo: cpf.length === 14 ? 'PJ' : 'PF',
      razao_social: null,
      nf_endereco: null,
      // guarda a descrição da proposta aqui — sem campo dedicado (visível no detalhe).
      como_conheceu: `Proposta customizada: ${descricao}`,
      consentimento_lgpd: true,
      consentimento_em: new Date().toISOString(),
    },
    customer: { name: nome, email, cpfCnpj: cpf, mobilePhone: telefone },
    asaas: {
      billingType: billing_type,
      valueReais: valorCobradoReais,
      description: descricao,
      externalReference: (id) => `${PROPOSTA_SLUG}:${id}`,
      dueDate: todayPlusDays(dueDays),
      installmentCount: installments > 1 ? installments : undefined,
      installmentValueReais: installments > 1 ? installmentValueReais : undefined,
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
    billing_type,
  })
}
