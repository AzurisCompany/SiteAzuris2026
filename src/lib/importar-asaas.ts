// Mapear cobranças que existem no Asaas mas NÃO no nosso banco — tipicamente
// criadas direto no painel do Asaas, fora do checkout. Lista pra revisão em
// /admin/importar e importa uma a uma como inscrição no bucket 'avulso-asaas'.
//
// NOTA sobre parcelado: o Asaas trata cada parcela como um pagamento próprio.
// Uma venda 3x aparece como 3 cobranças (mesma `installment`), cada uma com seu
// valor/status. A importação é POR PAGAMENTO — parceladas viram N linhas. Honesto
// em relação ao caixa (cada parcela recebida é receita daquela parcela).
import { listPayments, getPayment, getCustomer, mapAsaasStatus, type AsaasPaymentDetail } from '@/lib/asaas'
import {
  idsAsaasNoBanco,
  criarInscricaoImportada,
  type BillingType,
  type InscricaoRow,
} from '@/lib/db'

export const BUCKET_AVULSO = 'avulso-asaas'

export interface CobrancaFora {
  id: string
  descricao: string | null
  valorCentavos: number
  liquidoCentavos: number | null
  status: string // status cru do Asaas (RECEIVED, CONFIRMED, PENDING…)
  statusNorm: string // normalizado (paid/pending/…)
  billingType: string
  dueDate: string | null
  installment: string | null // id do parcelamento, se for parcela
  clienteNome: string | null
  clienteEmail: string | null
  clienteDoc: string | null
}

const reais2cent = (v: number | undefined | null) => (typeof v === 'number' ? Math.round(v * 100) : null)

/**
 * Varre as cobranças do Asaas (paginado) e devolve as que não têm inscrição no
 * banco, já enriquecidas com o cliente. `maxPaginas` limita o escaneamento pra
 * não estourar o tempo da request; `maxDetalhe` limita as buscas de cliente.
 */
export async function cobrancasForaDoBanco(
  { maxPaginas = 3, pageSize = 100, maxDetalhe = 60 } = {},
): Promise<{ total: number; itens: CobrancaFora[]; escaneadas: number; truncado: boolean }> {
  const idsBanco = await idsAsaasNoBanco()
  const fora: AsaasPaymentDetail[] = []
  let escaneadas = 0
  let truncado = false

  for (let page = 0; page < maxPaginas; page++) {
    const { data, hasMore } = await listPayments({ limit: pageSize, offset: page * pageSize })
    escaneadas += data.length
    for (const p of data) {
      if (p.id && !idsBanco.has(p.id)) fora.push(p)
    }
    if (!hasMore) break
    if (page === maxPaginas - 1 && hasMore) truncado = true
  }

  // Enriquamos só os primeiros N com o cliente (1 GET cada) pra manter a página rápida.
  const itens: CobrancaFora[] = []
  for (const p of fora.slice(0, maxDetalhe)) {
    let nome: string | null = null
    let email: string | null = null
    let doc: string | null = null
    try {
      const c = await getCustomer(p.customer)
      nome = c.name ?? null
      email = c.email ?? null
      doc = c.cpfCnpj ?? null
    } catch {
      // cliente pode ter sido removido — importa mesmo assim, sem nome
    }
    itens.push({
      id: p.id,
      descricao: p.description ?? null,
      valorCentavos: reais2cent(p.value) ?? 0,
      liquidoCentavos: reais2cent(p.netValue),
      status: p.status,
      statusNorm: mapAsaasStatus(p.status),
      billingType: p.billingType,
      dueDate: p.dueDate ?? null,
      installment: p.installment ?? null,
      clienteNome: nome,
      clienteEmail: email,
      clienteDoc: doc,
    })
  }

  return { total: fora.length, itens, escaneadas, truncado }
}

export type ImportarResultado =
  | { ok: true; inscricaoId: number; jaExistia: boolean }
  | { ok: false; erro: string }

/**
 * Importa UMA cobrança do Asaas (por id) como inscrição no bucket avulso.
 * Busca o pagamento + cliente atuais no Asaas (fonte da verdade) e persiste.
 */
export async function importarCobranca(
  asaasPaymentId: string,
  opts: { is_teste?: boolean } = {},
): Promise<ImportarResultado> {
  let payment: AsaasPaymentDetail
  try {
    // getPayment garante o estado atual (a lista pode estar defasada).
    payment = await getPayment(asaasPaymentId)
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'falha ao buscar o pagamento no Asaas' }
  }

  let clienteNome = 'Cliente Asaas'
  let clienteEmail = ''
  let clienteDoc = ''
  let telefone: string | null = null
  try {
    const c = await getCustomer(payment.customer)
    clienteNome = c.name || clienteNome
    clienteEmail = c.email || ''
    clienteDoc = (c.cpfCnpj || '').replace(/\D/g, '')
    telefone = c.mobilePhone ?? null
  } catch {
    // sem cliente: importa com placeholders (o pagamento é real)
  }

  const bruto = reais2cent(payment.value)
  const liquido = reais2cent(payment.netValue)
  const pago = payment.clientPaymentDate || payment.paymentDate || payment.confirmedDate || null

  try {
    const { row, jaExistia } = await criarInscricaoImportada({
      curso_slug: BUCKET_AVULSO,
      nome: clienteNome,
      email: clienteEmail,
      cpf_cnpj: clienteDoc,
      telefone,
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
