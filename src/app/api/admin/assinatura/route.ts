// POST /api/admin/assinatura  (protegido)
//   { action:'criar', ...dados }  → cria assinatura recorrente no Asaas
//   { action:'cancelar', id }     → cancela a assinatura (para de gerar ciclos)
// Cada ciclo cobrado é materializado como venda pelo webhook (ver db.materializarCicloAssinatura).
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import {
  criarAssinatura,
  vincularAssinaturaAsaas,
  apagarAssinatura,
  getAssinatura,
  cancelarAssinaturaRow,
  type BillingType,
} from '@/lib/db'
import { findOrCreateCustomer, createSubscription, cancelSubscription, type AsaasCycle } from '@/lib/asaas'
import { cpfCnpjValido } from '@/lib/validacao-doc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALOR_MINIMO_REAIS = 5
const CICLOS = new Set<AsaasCycle>(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'])
// Recorrência sem cartão tokenizado: PIX, boleto ou cliente escolhe.
const MEIOS = new Set<BillingType>(['PIX', 'BOLETO', 'UNDEFINED'])

function onlyDigits(s: string): string {
  return (s ?? '').replace(/\D/g, '')
}
function todayPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

interface CriarBody {
  action?: string
  id?: number
  nome?: string
  email?: string
  cpf_cnpj?: string
  telefone?: string
  valor_reais?: number
  cycle?: string
  billing_type?: string
  descricao?: string
  is_teste?: boolean
}

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }
  let b: CriarBody
  try {
    b = (await request.json()) as CriarBody
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // --- Cancelar ---
  if (b.action === 'cancelar') {
    if (!b.id || !Number.isInteger(b.id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
    const assin = await getAssinatura(b.id)
    if (!assin) return NextResponse.json({ error: 'assinatura não encontrada' }, { status: 404 })
    if (assin.asaas_subscription_id) {
      try {
        await cancelSubscription(assin.asaas_subscription_id)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'erro desconhecido'
        return NextResponse.json({ error: `Falha ao cancelar no Asaas: ${msg}` }, { status: 502 })
      }
    }
    await cancelarAssinaturaRow(b.id)
    return NextResponse.json({ ok: true, id: b.id, status: 'cancelled' })
  }

  // --- Criar ---
  if (!b.nome || b.nome.trim().length < 3) return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
  if (!b.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  const cpf = onlyDigits(b.cpf_cnpj ?? '')
  if (!cpfCnpjValido(cpf)) return NextResponse.json({ error: 'CPF/CNPJ inválido' }, { status: 400 })
  const tel = onlyDigits(b.telefone ?? '')
  if (tel && tel.length !== 10 && tel.length !== 11) return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
  if (typeof b.valor_reais !== 'number' || !Number.isFinite(b.valor_reais) || b.valor_reais < VALOR_MINIMO_REAIS) {
    return NextResponse.json({ error: `Valor mínimo é R$ ${VALOR_MINIMO_REAIS},00` }, { status: 400 })
  }
  if (!b.cycle || !CICLOS.has(b.cycle as AsaasCycle)) return NextResponse.json({ error: 'Frequência inválida' }, { status: 400 })
  if (!b.billing_type || !MEIOS.has(b.billing_type as BillingType)) {
    return NextResponse.json({ error: 'Meio inválido pra recorrência (use PIX, boleto ou "cliente escolhe")' }, { status: 400 })
  }
  if (!b.descricao || b.descricao.trim().length < 3) return NextResponse.json({ error: 'Descrição inválida' }, { status: 400 })

  const valorReais = Number(b.valor_reais.toFixed(2))
  const valorCentavos = Math.round(valorReais * 100)
  const cycle = b.cycle as AsaasCycle
  const billing_type = b.billing_type as BillingType

  // 1. Registra a assinatura antes do Asaas.
  let assinId: number
  try {
    const a = await criarAssinatura({
      nome: b.nome.trim(),
      email: b.email.trim().toLowerCase(),
      cpf_cnpj: cpf,
      telefone: tel || null,
      billing_type,
      valor_centavos: valorCentavos,
      cycle,
      descricao: b.descricao.trim(),
      is_teste: b.is_teste === true,
    })
    assinId = a.id
  } catch (e) {
    console.error('Falha ao registrar assinatura:', e)
    return NextResponse.json({ error: 'Falha ao registrar a assinatura.' }, { status: 500 })
  }

  // 2+3. Cliente + subscription no Asaas.
  try {
    const customer = await findOrCreateCustomer({
      name: b.nome.trim(),
      email: b.email.trim().toLowerCase(),
      cpfCnpj: cpf,
      mobilePhone: tel || null,
    })
    const sub = await createSubscription({
      customerId: customer.id,
      billingType: billing_type,
      valueReais: valorReais,
      cycle,
      nextDueDate: todayPlusDays(3),
      description: b.descricao.trim(),
      externalReference: `assinatura:${assinId}`,
    })
    await vincularAssinaturaAsaas(assinId, { asaas_subscription_id: sub.id, asaas_customer_id: customer.id })
    return NextResponse.json({ ok: true, id: assinId, subscriptionId: sub.id })
  } catch (e) {
    await apagarAssinatura(assinId).catch(() => {})
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return NextResponse.json({ error: `Falha ao criar assinatura: ${msg}` }, { status: 502 })
  }
}
