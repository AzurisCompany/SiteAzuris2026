// Orquestrador de criação de cobrança — o pipeline comum aos 3 fluxos (checkout
// Lakehouse, checkout DSSBR e cobrança avulsa do admin): anti-duplicação →
// inscrição pending → cliente + pagamento no Asaas → vínculo. Centraliza o cálculo
// de taxa (antes replicado em cada rota) e o rollback quando o Asaas falha.
//
// As rotas ficam só com: validar → derivar preço → chamar criarCobranca → responder.
import {
  buscarCobrancaDuplicada,
  criarInscricaoPendente,
  vincularAsaas,
  cancelarInscricao,
  type ChaveDedupe,
  type NovaInscricaoPendente,
  type InscricaoRow,
} from '@/lib/db'
import { findOrCreateCustomer, createPayment, type AsaasBillingType, type AsaasPayment, type CreateCustomerInput } from '@/lib/asaas'

export interface CriarCobrancaInput {
  dedupe: ChaveDedupe
  inscricao: NovaInscricaoPendente
  customer: CreateCustomerInput
  asaas: {
    billingType: AsaasBillingType
    valueReais: number
    description: string
    // string fixa, ou função do inscricaoId (a cobrança avulsa referencia o id gerado).
    externalReference: string | ((inscricaoId: number) => string)
    dueDate: string
    installmentCount?: number
    installmentValueReais?: number
  }
}

export type CriarCobrancaResultado =
  | { tipo: 'duplicada'; inscricao: InscricaoRow }
  | { tipo: 'criada'; inscricaoId: number; payment: AsaasPayment }
  | { tipo: 'erro_db' }
  | { tipo: 'erro_asaas'; mensagem: string }

export async function criarCobranca(input: CriarCobrancaInput): Promise<CriarCobrancaResultado> {
  // Anti-duplicação: fatura idêntica recente → devolve a existente.
  const dup = await buscarCobrancaDuplicada(input.dedupe)
  if (dup?.asaas_invoice_url) return { tipo: 'duplicada', inscricao: dup }

  // Inscrição 'pending' ANTES do Asaas (lead/vaga garantidos mesmo se a cobrança falhar).
  let inscricaoId: number
  try {
    const insc = await criarInscricaoPendente(input.inscricao)
    inscricaoId = insc.id
  } catch (e) {
    console.error('Falha ao registrar inscrição no DB:', e)
    return { tipo: 'erro_db' }
  }

  // Cliente + cobrança no Asaas. Se falhar, cancela a pendente (mantém o lead, libera a vaga).
  let customerId: string
  let payment: AsaasPayment
  try {
    const customer = await findOrCreateCustomer(input.customer)
    customerId = customer.id
    const { externalReference, ...restAsaas } = input.asaas
    payment = await createPayment({
      customerId,
      externalReference: typeof externalReference === 'function' ? externalReference(inscricaoId) : externalReference,
      ...restAsaas,
    })
  } catch (e) {
    await cancelarInscricao(inscricaoId).catch(() => {})
    return { tipo: 'erro_asaas', mensagem: e instanceof Error ? e.message : 'erro desconhecido' }
  }

  // Vincula os dados financeiros do Asaas (líquido/taxa/vencimento). Não-fatal:
  // o webhook/sync reconcilia se falhar.
  try {
    const bruto = typeof payment.value === 'number' ? Math.round(payment.value * 100) : null
    const liquido = typeof payment.netValue === 'number' ? Math.round(payment.netValue * 100) : null
    await vincularAsaas(inscricaoId, {
      asaas_customer_id: customerId,
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

  return { tipo: 'criada', inscricaoId, payment }
}
