// Mapear cobranças que existem no Asaas mas NÃO no nosso banco — tipicamente
// criadas direto no painel do Asaas, fora do checkout. Lista pra revisão em
// /admin/importar e importa como inscrição no bucket 'avulso-asaas'.
//
// PARCELADO: o Asaas trata cada parcela como um pagamento próprio, agrupado por
// um `installment` id. Aqui a gente AGRUPA por installment e importa o grupo como
// UMA venda (valor = soma das parcelas, installments = nº de parcelas, status
// agregado). Cobranças avulsas (sem installment) entram como 1 linha cada.
import {
  listPayments,
  getPayment,
  getInstallmentPayments,
  getCustomer,
  mapAsaasStatus,
  type AsaasPaymentDetail,
} from '@/lib/asaas'
import {
  idsAsaasNoBanco,
  criarInscricaoImportada,
  type BillingType,
  type InscricaoRow,
} from '@/lib/db'

export const BUCKET_AVULSO = 'avulso-asaas'

export interface CobrancaFora {
  tipo: 'single' | 'parcelado'
  importId: string // single: payment id · parcelado: installment id
  representanteId: string // payment id que vira asaas_payment_id da inscrição (idempotência)
  parcelas: number
  descricao: string | null
  valorCentavos: number // total (soma das parcelas)
  liquidoCentavos: number | null
  statusNorm: string
  statusLabel: string // ex.: "2/3 pagas" no parcelado
  billingType: string
  dueDate: string | null
  customerId: string
  clienteNome: string | null
  clienteEmail: string | null
  clienteDoc: string | null
}

const reais2cent = (v: number | undefined | null) => (typeof v === 'number' ? Math.round(v * 100) : null)

/** Descrição sem o prefixo "Parcela X de Y." que o Asaas põe em cada parcela. */
function limparDescricao(desc: string | null | undefined): string | null {
  if (!desc) return null
  return desc.replace(/^\s*Parcela\s+\d+\s+de\s+\d+\.?\s*/i, '').trim() || desc
}

/** Status agregado de um grupo de parcelas (espelha o modelo do checkout:
 *  cartão parcelado autorizado = venda paga). */
function statusGrupo(parcelas: AsaasPaymentDetail[]): { norm: string; label: string } {
  const norms = parcelas.map((p) => mapAsaasStatus(p.status))
  const pagas = norms.filter((s) => s === 'paid').length
  const total = parcelas.length
  let norm = 'pending'
  if (pagas > 0) norm = 'paid'
  else if (norms.some((s) => s === 'overdue')) norm = 'overdue'
  else if (norms.every((s) => s === 'cancelled')) norm = 'cancelled'
  else if (norms.every((s) => s === 'refunded')) norm = 'refunded'
  return { norm, label: `${pagas}/${total} pagas` }
}

/** Parcela representante do grupo (menor vencimento = parcela 1). */
function representante(parcelas: AsaasPaymentDetail[]): AsaasPaymentDetail {
  return [...parcelas].sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))[0]
}

function somaCent(parcelas: AsaasPaymentDetail[], campo: 'value' | 'netValue'): number | null {
  let achou = false
  let soma = 0
  for (const p of parcelas) {
    const c = reais2cent(p[campo])
    if (c != null) {
      achou = true
      soma += c
    }
  }
  return achou ? soma : null
}

/**
 * Varre as cobranças do Asaas (paginado), agrupa parceladas por installment e
 * devolve o que não tem inscrição no banco, enriquecido com o cliente.
 */
export async function cobrancasForaDoBanco(
  { maxPaginas = 3, pageSize = 100, maxDetalhe = 60 } = {},
): Promise<{ total: number; itens: CobrancaFora[]; escaneadas: number; truncado: boolean }> {
  const idsBanco = await idsAsaasNoBanco()
  const todas: AsaasPaymentDetail[] = []
  let escaneadas = 0
  let truncado = false

  for (let page = 0; page < maxPaginas; page++) {
    const { data, hasMore } = await listPayments({ limit: pageSize, offset: page * pageSize })
    escaneadas += data.length
    todas.push(...data)
    if (!hasMore) break
    if (page === maxPaginas - 1 && hasMore) truncado = true
  }

  // Separa parceladas (por installment) das avulsas.
  const grupos = new Map<string, AsaasPaymentDetail[]>()
  const avulsas: AsaasPaymentDetail[] = []
  for (const p of todas) {
    if (!p.id) continue
    if (p.installment) {
      const g = grupos.get(p.installment) ?? []
      g.push(p)
      grupos.set(p.installment, g)
    } else {
      avulsas.push(p)
    }
  }

  const itens: CobrancaFora[] = []

  for (const p of avulsas) {
    if (idsBanco.has(p.id)) continue // já no banco
    itens.push({
      tipo: 'single',
      importId: p.id,
      representanteId: p.id,
      parcelas: 1,
      descricao: p.description ?? null,
      valorCentavos: reais2cent(p.value) ?? 0,
      liquidoCentavos: reais2cent(p.netValue),
      statusNorm: mapAsaasStatus(p.status),
      statusLabel: mapAsaasStatus(p.status),
      billingType: p.billingType,
      dueDate: p.dueDate ?? null,
      customerId: p.customer,
      clienteNome: null,
      clienteEmail: null,
      clienteDoc: null,
    })
  }

  for (const [installmentId, membros] of grupos) {
    // Grupo já importado se QUALQUER parcela já está no banco (importamos 1 linha/grupo).
    if (membros.some((m) => m.id && idsBanco.has(m.id))) continue
    const rep = representante(membros)
    const { norm, label } = statusGrupo(membros)
    itens.push({
      tipo: 'parcelado',
      importId: installmentId,
      representanteId: rep.id,
      parcelas: membros.length,
      descricao: limparDescricao(rep.description),
      valorCentavos: somaCent(membros, 'value') ?? 0,
      liquidoCentavos: somaCent(membros, 'netValue'),
      statusNorm: norm,
      statusLabel: label,
      billingType: rep.billingType,
      dueDate: rep.dueDate ?? null,
      customerId: rep.customer,
      clienteNome: null,
      clienteEmail: null,
      clienteDoc: null,
    })
  }

  // Enriquece só os primeiros N com o cliente (1 GET cada) pra manter a página rápida.
  const cacheCliente = new Map<string, { nome: string | null; email: string | null; doc: string | null }>()
  for (const it of itens.slice(0, maxDetalhe)) {
    let c = cacheCliente.get(it.customerId)
    if (!c) {
      try {
        const cli = await getCustomer(it.customerId)
        c = { nome: cli.name ?? null, email: cli.email ?? null, doc: cli.cpfCnpj ?? null }
      } catch {
        c = { nome: null, email: null, doc: null }
      }
      cacheCliente.set(it.customerId, c)
    }
    it.clienteNome = c.nome
    it.clienteEmail = c.email
    it.clienteDoc = c.doc
  }

  return { total: itens.length, itens, escaneadas, truncado }
}

export type ImportarResultado =
  | { ok: true; inscricaoId: number; jaExistia: boolean }
  | { ok: false; erro: string }

async function clienteOuPlaceholder(customerId: string) {
  try {
    const c = await getCustomer(customerId)
    return {
      nome: c.name || 'Cliente Asaas',
      email: c.email || '',
      doc: (c.cpfCnpj || '').replace(/\D/g, ''),
      telefone: c.mobilePhone ?? null,
    }
  } catch {
    return { nome: 'Cliente Asaas', email: '', doc: '', telefone: null as string | null }
  }
}

/** Importa UMA cobrança avulsa (não parcelada) do Asaas como inscrição. */
export async function importarCobranca(
  asaasPaymentId: string,
  opts: { is_teste?: boolean } = {},
): Promise<ImportarResultado> {
  let payment: AsaasPaymentDetail
  try {
    payment = await getPayment(asaasPaymentId)
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'falha ao buscar o pagamento no Asaas' }
  }

  const cli = await clienteOuPlaceholder(payment.customer)
  const bruto = reais2cent(payment.value)
  const liquido = reais2cent(payment.netValue)
  const pago = payment.clientPaymentDate || payment.paymentDate || payment.confirmedDate || null

  try {
    const { row, jaExistia } = await criarInscricaoImportada({
      curso_slug: BUCKET_AVULSO,
      nome: cli.nome,
      email: cli.email,
      cpf_cnpj: cli.doc,
      telefone: cli.telefone,
      billing_type: (payment.billingType as BillingType) ?? 'UNDEFINED',
      valor_centavos: bruto ?? 0,
      installments: 1,
      status: mapAsaasStatus(payment.status) as InscricaoRow['status'],
      asaas_customer_id: payment.customer,
      asaas_payment_id: payment.id,
      asaas_invoice_url: payment.invoiceUrl ?? null,
      valor_liquido_centavos: liquido,
      taxa_centavos: bruto != null && liquido != null ? bruto - liquido : null,
      due_date: payment.dueDate ?? null,
      asaas_status: payment.status ?? null,
      pago_em: pago,
      como_conheceu: payment.description ?? null,
      is_teste: opts.is_teste ?? false,
    })
    return { ok: true, inscricaoId: row.id, jaExistia }
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'falha ao gravar a inscrição' }
  }
}

/**
 * Importa um PARCELAMENTO inteiro (todas as parcelas) como UMA venda: valor =
 * soma das parcelas, installments = nº de parcelas, status agregado. A inscrição
 * é chaveada pela parcela representante (menor vencimento) — idempotente.
 */
export async function importarInstallment(
  installmentId: string,
  opts: { is_teste?: boolean } = {},
): Promise<ImportarResultado> {
  let parcelas: AsaasPaymentDetail[]
  try {
    parcelas = await getInstallmentPayments(installmentId)
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'falha ao buscar o parcelamento no Asaas' }
  }
  if (parcelas.length === 0) {
    return { ok: false, erro: 'parcelamento sem pagamentos no Asaas' }
  }

  const rep = representante(parcelas)
  const cli = await clienteOuPlaceholder(rep.customer)
  const totalBruto = somaCent(parcelas, 'value') ?? 0
  const totalLiquido = somaCent(parcelas, 'netValue')
  const { norm } = statusGrupo(parcelas)
  const pago = rep.clientPaymentDate || rep.paymentDate || rep.confirmedDate || null

  try {
    const { row, jaExistia } = await criarInscricaoImportada({
      curso_slug: BUCKET_AVULSO,
      nome: cli.nome,
      email: cli.email,
      cpf_cnpj: cli.doc,
      telefone: cli.telefone,
      billing_type: (rep.billingType as BillingType) ?? 'CREDIT_CARD',
      valor_centavos: totalBruto,
      installments: parcelas.length,
      status: norm as InscricaoRow['status'],
      asaas_customer_id: rep.customer,
      asaas_payment_id: rep.id,
      asaas_invoice_url: rep.invoiceUrl ?? null,
      valor_liquido_centavos: totalLiquido,
      taxa_centavos: totalLiquido != null ? totalBruto - totalLiquido : null,
      due_date: rep.dueDate ?? null,
      asaas_status: rep.status ?? null,
      pago_em: pago,
      como_conheceu: limparDescricao(rep.description),
      is_teste: opts.is_teste ?? false,
    })
    return { ok: true, inscricaoId: row.id, jaExistia }
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'falha ao gravar a inscrição' }
  }
}
