// Checkout genérico por produto do registry ([[produtos]]) — a lógica que era da
// rota DSSBR, parametrizada pelo slug. Cada rota fica só com: parsear JSON →
// processarCheckout(slug, body) → NextResponse.
//
// Dois fluxos:
//  - PAGO: valida CPF/forma → deriva preço no servidor (tipo de ingresso ou preço
//    único) → criarCobranca (pipeline Asaas comum) → { invoiceUrl }.
//  - GRATUITO (tipo com preço R$ 0): sem CPF e sem Asaas — dedupe por email e
//    cadastro direto confirmado → { gratuito: true }.
import { type BillingType, buscarInscricaoGratuita, confirmarInscricaoGratuita, criarInscricaoPendente } from '@/lib/db'
import { cpfCnpjValido } from '@/lib/validacao-doc'
import { onlyDigits, todayPlusDays, hojeBRT } from '@/lib/format'
import { criarCobranca } from '@/lib/cobranca-pipeline'
import { valorParcela, totalComJuros, MAX_PARCELAS } from '@/lib/parcelamento'
import { getProduto } from '@/lib/produtos'
import {
  getTipo,
  valorCobradoDoTipo,
  ehGratuito,
  disponibilidadeDoTipo,
  contarInscritosPorTipo,
  type TipoIngresso,
} from '@/lib/tipos-ingresso'
import { normalizarExtras, type ExtrasInput } from '@/lib/checkout-extras'

export interface CheckoutBody extends ExtrasInput {
  nome: string
  email: string
  /** obrigatório só no fluxo pago (exigência do Asaas) */
  cpf_cnpj?: string
  telefone?: string
  /** tipo de ingresso cadastrado (opcional; sem ele, usa o preço único do registry) */
  tipo?: string
  /** ignorado no fluxo gratuito */
  billing_type?: BillingType
  installments?: number
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    content?: string
    term?: string
  }
}

/** Resposta pronta pra rota devolver: NextResponse.json(r.body, { status: r.status }). */
export interface CheckoutResposta {
  status: number
  body: Record<string, unknown>
}

const erro = (status: number, mensagem: string): CheckoutResposta => ({ status, body: { error: mensagem } })

export async function processarCheckout(produtoSlug: string, body: CheckoutBody): Promise<CheckoutResposta> {
  const PRODUTO = getProduto(produtoSlug)

  // Validação comum aos dois fluxos.
  if (!body.nome || body.nome.trim().length < 3) return erro(400, 'Nome inválido')
  if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) return erro(400, 'E-mail inválido')
  // Telefone: obrigatório onde o produto exige; onde não exige, só valida se veio.
  const tel = onlyDigits(body.telefone)
  const telInvalido = tel.length !== 10 && tel.length !== 11
  if ((PRODUTO.telefoneObrigatorio || tel.length > 0) && telInvalido) {
    return erro(400, 'Telefone inválido (DDD + número, 10 ou 11 dígitos)')
  }
  if (body.consentimento !== true) return erro(400, 'É necessário aceitar os termos de uso dos dados (LGPD)')

  // Tipo de ingresso (se veio) + janela de vendas + lotação.
  let tipo: TipoIngresso | null = null
  if (body.tipo) {
    tipo = await getTipo(PRODUTO.slug, body.tipo)
    if (!tipo || !tipo.ativo) return erro(400, 'Tipo de ingresso indisponível')
    const inscritos =
      tipo.limite_qtd != null ? ((await contarInscritosPorTipo(PRODUTO.slug))[tipo.tipo_id] ?? 0) : 0
    const disp = disponibilidadeDoTipo(tipo, hojeBRT(), inscritos)
    if (!disp.disponivel) {
      return erro(
        400,
        disp.motivo === 'esgotado' ? 'Ingressos esgotados pra esse tipo' : 'Vendas encerradas pra esse tipo de ingresso'
      )
    }
  }

  const nome = body.nome.trim()
  const email = body.email.trim().toLowerCase()
  const telefone = tel || null

  // ── Fluxo GRATUITO: cadastro direto confirmado, sem CPF e sem Asaas.
  if (tipo && ehGratuito(tipo)) {
    const existente = await buscarInscricaoGratuita(PRODUTO.slug, email, tipo.tipo_id)
    if (existente) return { status: 200, body: { ok: true, gratuito: true, duplicada: true } }
    try {
      const insc = await criarInscricaoPendente({
        curso_slug: PRODUTO.slug,
        lote: 'unico',
        tipo_ingresso: tipo.tipo_id,
        nome,
        email,
        cpf_cnpj: '', // não coletado no gratuito (só é exigido pelo Asaas)
        telefone,
        billing_type: 'GRATIS',
        valor_centavos: 0,
        installments: 1,
        utm_source: body.utm?.source ?? null,
        utm_medium: body.utm?.medium ?? null,
        utm_campaign: body.utm?.campaign ?? null,
        utm_content: body.utm?.content ?? null,
        utm_term: body.utm?.term ?? null,
        ...normalizarExtras(body),
        consentimento_lgpd: true,
        consentimento_em: new Date().toISOString(),
      })
      await confirmarInscricaoGratuita(insc.id)
      return { status: 200, body: { ok: true, gratuito: true } }
    } catch (e) {
      console.error('Falha ao registrar inscrição gratuita:', e)
      return erro(500, 'Falha ao registrar inscrição. Tenta de novo.')
    }
  }

  // ── Fluxo PAGO (comportamento idêntico ao checkout DSSBR original).
  if (!cpfCnpjValido(onlyDigits(body.cpf_cnpj))) return erro(400, 'CPF/CNPJ inválido (dígito verificador não confere)')
  if (body.billing_type !== 'PIX' && body.billing_type !== 'CREDIT_CARD') return erro(400, 'Forma de pagamento inválida')
  if (body.billing_type === 'CREDIT_CARD') {
    const n = body.installments ?? 1
    if (!Number.isInteger(n) || n < 1 || n > MAX_PARCELAS) return erro(400, `Parcelamento inválido (1 a ${MAX_PARCELAS})`)
  }
  const billing: 'PIX' | 'CREDIT_CARD' = body.billing_type === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX'

  // Preço SEMPRE derivado no servidor. Com tipo → preço/parcelas vêm dele; senão,
  // preço único do registry. Regra PIX/cartão idêntica — ver [[parcelamento]].
  let tipoIngresso: string | null = null
  let descricaoAsaas = PRODUTO.asaasDescricao
  let externalRef = PRODUTO.slug
  let installments: number
  let installmentValueReais: number
  let valorCobradoReais: number

  if (tipo) {
    const cobrado = valorCobradoDoTipo(tipo, billing, body.installments ?? 1)
    installments = cobrado.installments
    installmentValueReais = cobrado.installmentValueReais
    valorCobradoReais = cobrado.valorReais
    tipoIngresso = tipo.tipo_id
    descricaoAsaas = `${PRODUTO.asaasDescricao} — ${tipo.nome}`
    externalRef = `${PRODUTO.slug}:${tipo.tipo_id}`
  } else {
    const precoBaseReais = PRODUTO.precoCentavos / 100
    const precoCartaoBaseReais = Number((precoBaseReais * (1 + PRODUTO.cartaoAcrescimoPct)).toFixed(2))
    installments =
      body.billing_type === 'CREDIT_CARD' ? Math.min(Math.max(body.installments ?? 1, 1), PRODUTO.maxParcelas) : 1
    installmentValueReais = valorParcela(precoCartaoBaseReais, installments)
    valorCobradoReais =
      body.billing_type === 'PIX'
        ? Number((precoBaseReais * (1 - PRODUTO.pixDescontoPct)).toFixed(2))
        : totalComJuros(precoCartaoBaseReais, installments)
  }
  const valorCobradoCentavos = Math.round(valorCobradoReais * 100)
  const cpf = onlyDigits(body.cpf_cnpj)

  const resultado = await criarCobranca({
    dedupe: { curso_slug: PRODUTO.slug, cpf_cnpj: cpf, valor_centavos: valorCobradoCentavos, tipo_ingresso: tipoIngresso },
    inscricao: {
      curso_slug: PRODUTO.slug,
      lote: 'unico',
      tipo_ingresso: tipoIngresso,
      nome,
      email,
      cpf_cnpj: cpf,
      telefone,
      billing_type: billing,
      valor_centavos: valorCobradoCentavos,
      installments,
      utm_source: body.utm?.source ?? null,
      utm_medium: body.utm?.medium ?? null,
      utm_campaign: body.utm?.campaign ?? null,
      utm_content: body.utm?.content ?? null,
      utm_term: body.utm?.term ?? null,
      ...normalizarExtras(body),
      consentimento_lgpd: true,
      consentimento_em: new Date().toISOString(),
    },
    customer: { name: nome, email, cpfCnpj: cpf, mobilePhone: telefone },
    asaas: {
      billingType: billing,
      valueReais: valorCobradoReais,
      description: descricaoAsaas,
      externalReference: externalRef,
      dueDate: todayPlusDays(3),
      installmentCount: installments > 1 ? installments : undefined,
      installmentValueReais: installments > 1 ? installmentValueReais : undefined,
    },
  })

  if (resultado.tipo === 'duplicada') {
    const d = resultado.inscricao
    return {
      status: 200,
      body: { ok: true, invoiceUrl: d.asaas_invoice_url, paymentId: d.asaas_payment_id, valor: d.valor_centavos / 100, duplicada: true },
    }
  }
  if (resultado.tipo === 'erro_db') return erro(500, 'Falha ao registrar inscrição. Tenta de novo.')
  if (resultado.tipo === 'erro_asaas') return erro(502, `Falha ao criar cobrança: ${resultado.mensagem}`)

  return {
    status: 200,
    body: { ok: true, invoiceUrl: resultado.payment.invoiceUrl, paymentId: resultado.payment.id, valor: valorCobradoReais },
  }
}
