// POST /api/inscricao
// Recebe dados do form, valida, cria customer + payment no Asaas, salva no DB.
// Retorna { invoiceUrl } pra o cliente redirecionar pro checkout.

import { NextResponse } from 'next/server'
import { criarInscricao, determinarLoteAtivo, type BillingType } from '@/lib/db'
import { createPayment, findOrCreateCustomer } from '@/lib/asaas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RequestBody {
  nome: string
  email: string
  cpf_cnpj: string
  telefone?: string
  billing_type: BillingType
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

  if (body.billing_type !== 'PIX' && body.billing_type !== 'CREDIT_CARD') return 'Forma de pagamento inválida'

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

  // Descobre lote ativo + preço base
  const { lote, vagasRestantes, preco_centavos: precoBaseCentavos } = await determinarLoteAtivo()
  if (vagasRestantes <= 0) {
    return NextResponse.json(
      { error: 'Não há mais vagas neste momento. Entre em contato pra fila de espera.' },
      { status: 409 }
    )
  }

  // Calcula valor cobrado conforme forma de pagamento.
  // PIX: 5% off, à vista. Cartão: valor cheio. O parcelamento (até 5x — 1-2x sem
  // juros, 3-5x com juros repassados ao cliente) é escolhido pelo próprio cliente
  // no checkout do Asaas, conforme a config de parcelamento da conta. Por isso NÃO
  // pré-fixamos installmentCount aqui — senão o Asaas não consegue aplicar o juro.
  const valorCobradoCentavos =
    body.billing_type === 'PIX'
      ? Math.round(precoBaseCentavos * 0.95)
      : precoBaseCentavos
  const valorCobradoReais = valorCobradoCentavos / 100

  // Cria/recupera customer no Asaas
  let customer
  try {
    customer = await findOrCreateCustomer({
      name: body.nome.trim(),
      email: body.email.trim().toLowerCase(),
      cpfCnpj: onlyDigits(body.cpf_cnpj),
      mobilePhone: body.telefone ? onlyDigits(body.telefone) : null,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return NextResponse.json({ error: `Falha ao criar cliente: ${msg}` }, { status: 502 })
  }

  // Cria cobrança no Asaas
  let payment
  try {
    payment = await createPayment({
      customerId: customer.id,
      billingType: body.billing_type,
      valueReais: valorCobradoReais,
      description: `Lakehouse: Pipeline na Prática — ${lote === 'lote1' ? 'Lote 1' : 'Lote 2'}`,
      externalReference: `lakehouse-comunidade:${lote}`,
      dueDate: todayPlusDays(3),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return NextResponse.json({ error: `Falha ao criar cobrança: ${msg}` }, { status: 502 })
  }

  // Salva inscrição no DB
  try {
    await criarInscricao({
      curso_slug: 'lakehouse-comunidade',
      lote,
      nome: body.nome.trim(),
      email: body.email.trim().toLowerCase(),
      cpf_cnpj: onlyDigits(body.cpf_cnpj),
      telefone: body.telefone ? onlyDigits(body.telefone) : null,
      billing_type: body.billing_type,
      valor_centavos: valorCobradoCentavos,
      installments: 1, // nº real de parcelas é escolhido no checkout do Asaas; webhook pode atualizar
      asaas_customer_id: customer.id,
      asaas_payment_id: payment.id,
      asaas_invoice_url: payment.invoiceUrl,
      utm_source: body.utm?.source ?? null,
      utm_medium: body.utm?.medium ?? null,
      utm_campaign: body.utm?.campaign ?? null,
      utm_content: body.utm?.content ?? null,
      utm_term: body.utm?.term ?? null,
    })
  } catch (e) {
    // Asaas já criou — não desfazemos aqui, só logamos. Webhook ainda vai atualizar a inscrição quando pagar.
    console.error('Falha ao salvar inscrição no DB (cobrança Asaas criada):', e)
  }

  return NextResponse.json({
    ok: true,
    invoiceUrl: payment.invoiceUrl,
    paymentId: payment.id,
    valor: valorCobradoReais,
    lote,
  })
}
