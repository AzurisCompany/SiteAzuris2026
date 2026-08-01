// POST /api/ett/assinatura  (público)
// Assinatura da Trilha de Dedicação do ETT: R$39/mês ou R$390/ano ([[ett]]).
//
// Diferente de todo o resto do checkout público, aqui não nasce um pagamento e sim
// uma SUBSCRIPTION no Asaas — ela gera um pagamento por ciclo, e cada ciclo cobrado
// é materializado como venda pelo webhook (db.materializarCicloAssinatura), caindo
// na aba do produto graças ao produto_slug.
//
// billingType = UNDEFINED de propósito: o cliente escolhe PIX, boleto ou cartão na
// fatura do Asaas. No cartão a renovação é automática; no PIX ele paga cada ciclo.
// Não dá pra fixar CREDIT_CARD aqui sem tokenizar o cartão no nosso domínio.
import { NextResponse } from 'next/server'
import {
  criarAssinatura,
  vincularAssinaturaAsaas,
  apagarAssinatura,
  assinaturaAtivaDoProduto,
} from '@/lib/db'
import { findOrCreateCustomer, createSubscription, getSubscriptionPayments } from '@/lib/asaas'
import { cpfCnpjValido } from '@/lib/validacao-doc'
import { onlyDigits, todayPlusDays } from '@/lib/format'
import { getPlanoEtt, ETT_ASSINATURA_SLUG } from '@/lib/ett'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  nome?: string
  email?: string
  cpf_cnpj?: string
  telefone?: string
  /** id do plano ([[ett]]) — o VALOR vem daqui pelo servidor, nunca do client */
  plano?: string
  consentimento?: boolean
}

/** Link da cobrança que o cliente ainda pode pagar (a do ciclo corrente). */
async function linkPrimeiraCobranca(subscriptionId: string): Promise<string | null> {
  try {
    const pagamentos = await getSubscriptionPayments(subscriptionId)
    const pagavel = pagamentos.find(
      (p) => (p.status === 'PENDING' || p.status === 'OVERDUE') && !!p.invoiceUrl
    )
    return pagavel?.invoiceUrl ?? null
  } catch (e) {
    // Assinatura já existe no Asaas; só não conseguimos o link agora.
    console.error('Falha ao buscar cobranças da assinatura:', e)
    return null
  }
}

export async function POST(request: Request) {
  let b: Body
  try {
    b = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const plano = getPlanoEtt(b.plano)
  if (!plano) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  if (!b.nome || b.nome.trim().length < 3) return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
  if (!b.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }
  const cpf = onlyDigits(b.cpf_cnpj)
  if (!cpfCnpjValido(cpf)) {
    return NextResponse.json({ error: 'CPF/CNPJ inválido (dígito verificador não confere)' }, { status: 400 })
  }
  const tel = onlyDigits(b.telefone)
  if (tel.length !== 10 && tel.length !== 11) {
    return NextResponse.json({ error: 'Telefone inválido (DDD + número, 10 ou 11 dígitos)' }, { status: 400 })
  }
  if (b.consentimento !== true) {
    return NextResponse.json({ error: 'É necessário aceitar os termos de uso dos dados (LGPD)' }, { status: 400 })
  }

  const nome = b.nome.trim()
  const email = b.email.trim().toLowerCase()
  const valorReais = plano.valorCentavos / 100

  // Já assina? Devolve a cobrança em aberto em vez de criar uma segunda recorrência.
  const existente = await assinaturaAtivaDoProduto(ETT_ASSINATURA_SLUG, email)
  if (existente) {
    const url = existente.asaas_subscription_id ? await linkPrimeiraCobranca(existente.asaas_subscription_id) : null
    return NextResponse.json({ ok: true, duplicada: true, invoiceUrl: url, id: existente.id })
  }

  // 1. Registra a assinatura antes do Asaas (mesma ordem do fluxo do admin).
  let assinId: number
  try {
    const a = await criarAssinatura({
      produto_slug: ETT_ASSINATURA_SLUG,
      nome,
      email,
      cpf_cnpj: cpf,
      telefone: tel,
      billing_type: 'UNDEFINED',
      valor_centavos: plano.valorCentavos,
      cycle: plano.cycle,
      descricao: plano.descricao,
    })
    assinId = a.id
  } catch (e) {
    console.error('Falha ao registrar assinatura ETT:', e)
    return NextResponse.json({ error: 'Falha ao registrar a assinatura. Tenta de novo.' }, { status: 500 })
  }

  // 2+3. Cliente + subscription no Asaas. Se qualquer um falhar, some com a linha
  // órfã — senão a trava de duplicidade barra o cliente numa assinatura que não existe.
  try {
    const customer = await findOrCreateCustomer({
      name: nome,
      email,
      cpfCnpj: cpf,
      mobilePhone: tel,
    })
    const sub = await createSubscription({
      customerId: customer.id,
      billingType: 'UNDEFINED',
      valueReais: valorReais,
      cycle: plano.cycle,
      nextDueDate: todayPlusDays(3),
      description: plano.descricao,
      externalReference: `${ETT_ASSINATURA_SLUG}:${assinId}`,
    })
    await vincularAssinaturaAsaas(assinId, { asaas_subscription_id: sub.id, asaas_customer_id: customer.id })
    const invoiceUrl = await linkPrimeiraCobranca(sub.id)
    return NextResponse.json({ ok: true, id: assinId, invoiceUrl, valor: valorReais })
  } catch (e) {
    await apagarAssinatura(assinId).catch(() => {})
    // Detalhe do Asaas fica no log: esta rota é pública, e a mensagem crua expõe
    // endpoint e documento na tela do cliente (no admin a gente devolve crua).
    console.error('Falha ao criar assinatura ETT no Asaas:', e)
    return NextResponse.json(
      { error: 'Não conseguimos criar sua assinatura agora. Tenta de novo em instantes.' },
      { status: 502 }
    )
  }
}
