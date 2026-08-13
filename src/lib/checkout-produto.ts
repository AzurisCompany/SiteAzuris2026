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
import { normalizarExtras, validarExtras, enderecoParaAsaas, type ExtrasInput } from '@/lib/checkout-extras'
import { resolverDesconto, aplicarDesconto } from '@/lib/cupons'

export interface CheckoutBody extends ExtrasInput {
  nome: string
  email: string
  /** obrigatório só no fluxo pago (exigência do Asaas) */
  cpf_cnpj?: string
  telefone?: string
  /** tipo de ingresso cadastrado (opcional; sem ele, usa o preço único do registry) */
  tipo?: string
  /** token do link de vendedora ([[cupom]]); concede % de desconto, nunca um preço */
  cupom?: string
  /** código puro do cupom de parceiro (?c=), sem prazo — validado em [[cupons]] */
  cupom_codigo?: string
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

  // Desconto: revalidado AQUI, sempre — o cliente pode ter adulterado a URL
  // entre a página e o POST, e o cupom pode ter sido desligado no admin no meio
  // do preenchimento do formulário. Recusa de qualquer tipo → preço cheio, sem
  // erro na cara de quem está comprando. Ver [[cupons]].
  const { aplicado: cupom } = await resolverDesconto(
    { token: body.cupom, codigo: body.cupom_codigo },
    PRODUTO.slug
  )

  // Atribuição: com cupom válido, quem vendeu é a vendedora assinada no token —
  // não o que veio na URL, que o cliente pode ter perdido ao copiar o link.
  // É daqui que sai a comissão (colunas utm_* já existentes, e o CSV do admin).
  const utm = {
    source: cupom ? cupom.tipo : (body.utm?.source ?? null),
    medium: cupom ? 'link' : (body.utm?.medium ?? null),
    campaign: body.utm?.campaign ?? null,
    content: cupom ? cupom.codigo : (body.utm?.content ?? null),
    term: body.utm?.term ?? null,
  }

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
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        utm_content: utm.content,
        utm_term: utm.term,
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
  const erroExtras = validarExtras(body, {
    cpfCnpj: body.cpf_cnpj,
    enderecoObrigatorioPJ: PRODUTO.enderecoObrigatorioPJ,
  })
  if (erroExtras) return erro(400, erroExtras)
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
    // O desconto do cupom entra no PREÇO DO INGRESSO, antes das regras de PIX e
    // parcelamento — assim os juros de 2x-3x incidem sobre o valor já com desconto.
    const tipoEfetivo = cupom ? { ...tipo, preco_centavos: aplicarDesconto(tipo.preco_centavos, cupom.pct) } : tipo
    const cobrado = valorCobradoDoTipo(tipoEfetivo, billing, body.installments ?? 1)
    installments = cobrado.installments
    installmentValueReais = cobrado.installmentValueReais
    valorCobradoReais = cobrado.valorReais
    tipoIngresso = tipo.tipo_id
    descricaoAsaas = `${PRODUTO.asaasDescricao} — ${tipo.nome}`
    externalRef = `${PRODUTO.slug}:${tipo.tipo_id}`
  } else {
    const precoBaseReais = (cupom ? aplicarDesconto(PRODUTO.precoCentavos, cupom.pct) : PRODUTO.precoCentavos) / 100
    const precoCartaoBaseReais = Number((precoBaseReais * (1 + PRODUTO.cartaoAcrescimoPct)).toFixed(2))
    installments =
      body.billing_type === 'CREDIT_CARD' ? Math.min(Math.max(body.installments ?? 1, 1), PRODUTO.maxParcelas) : 1
    installmentValueReais = valorParcela(precoCartaoBaseReais, installments)
    valorCobradoReais =
      body.billing_type === 'PIX'
        ? Number((precoBaseReais * (1 - PRODUTO.pixDescontoPct)).toFixed(2))
        : totalComJuros(precoCartaoBaseReais, installments)
  }
  if (cupom) {
    // Carimba na cobrança POR QUE ela saiu mais barata — sem isso, conciliar um
    // R$513 solto no extrato do Asaas vira adivinhação.
    descricaoAsaas = `${descricaoAsaas} — desconto ${cupom.pct}%`
    externalRef = `${externalRef}:cupom-${cupom.codigo}`
  }
  const valorCobradoCentavos = Math.round(valorCobradoReais * 100)
  const cpf = onlyDigits(body.cpf_cnpj)
  const extras = normalizarExtras(body, cpf)
  const endereco = enderecoParaAsaas(extras.nf_endereco)

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
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      utm_content: utm.content,
      utm_term: utm.term,
      ...extras,
      consentimento_lgpd: true,
      consentimento_em: new Date().toISOString(),
    },
    // Na nota, o tomador é o dono do documento: PJ entra pela razão social, não
    // pelo nome de quem preencheu o form (esse fica na nossa coluna `nome`).
    customer: {
      name: extras.pessoa_tipo === 'PJ' && extras.razao_social ? extras.razao_social : nome,
      email,
      cpfCnpj: cpf,
      mobilePhone: telefone,
      company: extras.razao_social,
      ...(endereco ?? {}),
    },
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
