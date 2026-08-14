// O que este arquivo protege: o desconto de vendedora só existe de verdade se
// o VALOR QUE VAI PRO ASAAS mudar. Testar só a leitura do token deixaria passar
// um cupom bonito na tela e preço cheio na cobrança.
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import type { TipoIngresso } from '@/lib/tipos-ingresso'

const getTipo = vi.fn<(p: string, t: string) => Promise<TipoIngresso | null>>()
const criarCobranca = vi.fn()

vi.mock('@/lib/tipos-ingresso', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/tipos-ingresso')>()),
  getTipo: (p: string, t: string) => getTipo(p, t),
  contarInscritosPorTipo: async () => ({}),
}))

vi.mock('@/lib/cobranca-pipeline', () => ({
  criarCobranca: (...a: unknown[]) => criarCobranca(...a),
}))

// O banco responde de verdade pras duas perguntas que o resolvedor faz: a linha
// do cupom e quantas inscrições já entraram por ele.
export const cupomNoBanco: Record<string, unknown> | null = {
  id: 1,
  codigo: 'ana-paula',
  nome: 'Ana Paula',
  tipo: 'vendedora',
  produto_slug: 'dss-2026',
  pct: 10,
  validade_horas: 48,
  limite_usos: null,
  ativo: true,
}
const estado = { cupom: { ...cupomNoBanco } as Record<string, unknown> | null, usos: 0 }

vi.mock('@/lib/db', () => ({
  sql: (strings: TemplateStringsArray) => {
    const q = strings.join(' ')
    if (q.includes('FROM cupons')) return Promise.resolve(estado.cupom ? [estado.cupom] : [])
    if (q.includes('COUNT(*)::int AS n')) return Promise.resolve([{ n: estado.usos }])
    return Promise.resolve([])
  },
}))

const { processarCheckout } = await import('@/lib/checkout-produto')
const { criarCupom, assinarCupom } = await import('@/lib/cupom')
const { TIPOS_CUPOM, LABEL_TIPO_CUPOM } = await import('@/lib/cupons')

/** Reescreve a linha do cupom que o banco falso devolve. */
function cupomEh(patch: Record<string, unknown> | null) {
  estado.cupom = patch === null ? null : { ...cupomNoBanco, ...patch }
}

/** Lote 1 do FullPass como está cadastrado no admin hoje. */
const LOTE_1: TipoIngresso = {
  id: 1,
  produto_slug: 'dss-2026',
  tipo_id: 'lote-1',
  nome: 'Lote 1',
  descricao: null,
  preco_centavos: 57000,
  preco_de_centavos: 82000,
  pix_desconto_pct: 0,
  cartao_acrescimo_pct: 0,
  max_parcelas: 3,
  ativo: true,
  oculto: false,
  ordem: 0,
  vendas_ate: null,
  limite_qtd: null,
}

const body = {
  nome: 'Fulano de Tal',
  email: 'fulano@exemplo.com',
  telefone: '41999998888',
  cpf_cnpj: '11144477735',
  tipo: 'lote-1',
  billing_type: 'PIX' as const,
  consentimento: true,
}

/** Valor em reais que foi efetivamente pedido ao Asaas na última chamada. */
const valorPedido = () => criarCobranca.mock.calls[0][0].asaas.valueReais
const inscricaoGravada = () => criarCobranca.mock.calls[0][0].inscricao

beforeAll(() => {
  process.env.CUPOM_SECRET = 'segredo-de-teste-nao-usar-em-prod'
})

describe('checkout do FullPass com link de vendedora', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getTipo.mockResolvedValue(LOTE_1)
    cupomEh({})
    estado.usos = 0
    criarCobranca.mockResolvedValue({ tipo: 'criada', payment: { id: 'pay_1', invoiceUrl: 'https://asaas/x' } })
  })

  it('sem cupom, cobra o preço cheio do lote', async () => {
    await processarCheckout('dss-2026', body)

    expect(valorPedido()).toBe(570)
  })

  it('com cupom válido, cobra R$513 no PIX — e é isso que vai pro Asaas', async () => {
    const { token } = criarCupom({ codigo: 'ana-paula', produto: 'dss-2026' })

    const r = await processarCheckout('dss-2026', { ...body, cupom: token })

    expect(r.status).toBe(200)
    expect(valorPedido()).toBe(513)
    expect(inscricaoGravada().valor_centavos).toBe(51300)
  })

  it('no cartão em 3x, os juros incidem sobre o valor JÁ com desconto', async () => {
    const { token } = criarCupom({ codigo: 'ana-paula', produto: 'dss-2026' })

    await processarCheckout('dss-2026', { ...body, cupom: token, billing_type: 'CREDIT_CARD', installments: 3 })
    const comDesconto = valorPedido()
    criarCobranca.mockClear()

    await processarCheckout('dss-2026', { ...body, billing_type: 'CREDIT_CARD', installments: 3 })
    const cheio = valorPedido()

    expect(comDesconto).toBeLessThan(cheio)
    expect(comDesconto / cheio).toBeCloseTo(0.9, 2)
  })

  it('a venda fica carimbada no nome da vendedora (é daí que sai a comissão)', async () => {
    const { token } = criarCupom({ codigo: 'ana-paula', produto: 'dss-2026' })

    await processarCheckout('dss-2026', { ...body, cupom: token, utm: { source: 'instagram', campaign: 'agosto' } })

    expect(inscricaoGravada()).toMatchObject({
      utm_source: 'vendedora',
      utm_medium: 'link',
      utm_content: 'ana-paula', // vence a utm_source que veio na URL
      utm_campaign: 'agosto', // campanha do link é preservada
    })
  })

  it('a cobrança diz por que saiu mais barata', async () => {
    const { token } = criarCupom({ codigo: 'ana-paula', produto: 'dss-2026' })

    await processarCheckout('dss-2026', { ...body, cupom: token })
    const asaas = criarCobranca.mock.calls[0][0].asaas

    expect(asaas.description).toContain('desconto 10%')
    expect(asaas.externalReference).toBe('dss-2026:lote-1:cupom-ana-paula')
  })

  it('cupom vencido: cobra o preço cheio, sem erro na cara do cliente', async () => {
    const vencido = assinarCupom({ codigo: 'ana-paula', produto: 'dss-2026', pct: 10, exp: Date.now() - 1000 })

    const r = await processarCheckout('dss-2026', { ...body, cupom: vencido })

    expect(r.status).toBe(200)
    expect(valorPedido()).toBe(570)
    expect(inscricaoGravada().utm_source).toBeNull()
  })

  it('token adulterado pra 90% off não desconta nada', async () => {
    const forjado = `${Buffer.from(['ana', 'dss-2026', '90', String(Date.now() + 10 ** 9)].join('|')).toString(
      'base64url'
    )}.0123456789abcdef0123456789abcdef`

    await processarCheckout('dss-2026', { ...body, cupom: forjado })

    expect(valorPedido()).toBe(570)
  })

  it('cupom de outro produto não vale aqui', async () => {
    const { token } = criarCupom({ codigo: 'ana-paula', produto: 'dss-one-day-2026' })

    await processarCheckout('dss-2026', { ...body, cupom: token })

    expect(valorPedido()).toBe(570)
  })

  it('cupom não burla lote encerrado nem ingresso esgotado', async () => {
    getTipo.mockResolvedValue({ ...LOTE_1, vendas_ate: '2026-01-01' })
    const { token } = criarCupom({ codigo: 'ana-paula', produto: 'dss-2026' })

    const r = await processarCheckout('dss-2026', { ...body, cupom: token })

    expect(r.status).toBe(400)
    expect(criarCobranca).not.toHaveBeenCalled()
  })
})

// As regras que só existem porque agora há tabela por trás ([[cupons]]).
describe('cupom desligado, esgotado e link fixo de parceiro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getTipo.mockResolvedValue(LOTE_1)
    cupomEh({})
    estado.usos = 0
    criarCobranca.mockResolvedValue({ tipo: 'criada', payment: { id: 'pay_1', invoiceUrl: 'https://asaas/x' } })
  })

  it('desligar no admin mata o link que já estava na mão do cliente', async () => {
    const { token } = criarCupom({ codigo: 'ana-paula', produto: 'dss-2026' })
    cupomEh({ ativo: false })

    await processarCheckout('dss-2026', { ...body, cupom: token })

    expect(valorPedido()).toBe(570)
  })

  it('cupom apagado do cadastro não desconta, mesmo com token válido', async () => {
    const { token } = criarCupom({ codigo: 'ana-paula', produto: 'dss-2026' })
    cupomEh(null)

    await processarCheckout('dss-2026', { ...body, cupom: token })

    expect(valorPedido()).toBe(570)
  })

  it('quem manda no percentual é a linha do banco, não o token', async () => {
    // Token assinado com 10%; admin mudou pra 15% depois que o link saiu.
    const { token } = criarCupom({ codigo: 'ana-paula', produto: 'dss-2026', pct: 10 })
    cupomEh({ pct: 15 })

    await processarCheckout('dss-2026', { ...body, cupom: token })

    expect(valorPedido()).toBe(484.5) // 570 − 15%
  })

  it('limite de inscrições: no limite, para de descontar', async () => {
    const { token } = criarCupom({ codigo: 'ana-paula', produto: 'dss-2026' })
    cupomEh({ limite_usos: 3 })

    estado.usos = 2
    await processarCheckout('dss-2026', { ...body, cupom: token })
    expect(valorPedido()).toBe(513)

    criarCobranca.mockClear()
    estado.usos = 3
    await processarCheckout('dss-2026', { ...body, cupom: token })
    expect(valorPedido()).toBe(570)
  })

  it('parceiro: o código puro vale como link, sem prazo', async () => {
    cupomEh({ codigo: 'gaio15', nome: 'Gaio', tipo: 'parceiro', pct: 15, validade_horas: null })

    await processarCheckout('dss-2026', { ...body, cupom_codigo: 'GAIO15' })

    expect(valorPedido()).toBe(484.5)
    expect(inscricaoGravada()).toMatchObject({ utm_source: 'parceiro', utm_content: 'gaio15' })
  })

  it('código de VENDEDORA não vale como link — senão as 48h não existiriam', async () => {
    cupomEh({ codigo: 'ana-paula', validade_horas: 48 })

    await processarCheckout('dss-2026', { ...body, cupom_codigo: 'ana-paula' })

    expect(valorPedido()).toBe(570)
  })

  // As abas "Link de vendedora" e "Parceiro" de /admin/vendas filtram por
  // utm_source. Se o checkout carimbar outra coisa, a aba fica muda — e ninguém
  // descobre olhando a tela, porque "0 vendas" é um resultado plausível.
  it('o utm_source carimbado é exatamente o valor que as abas de origem filtram', async () => {
    for (const tipo of TIPOS_CUPOM) {
      vi.clearAllMocks()
      criarCobranca.mockResolvedValue({ tipo: 'criada', payment: { id: 'pay_1', invoiceUrl: 'https://asaas/x' } })
      const codigo = `cod-${tipo}`
      cupomEh({ codigo, tipo, validade_horas: tipo === 'parceiro' ? null : 48 })
      const comLink =
        tipo === 'parceiro'
          ? { ...body, cupom_codigo: codigo.toUpperCase() }
          : { ...body, cupom: criarCupom({ codigo, produto: 'dss-2026' }).token }

      await processarCheckout('dss-2026', comLink)

      expect(inscricaoGravada().utm_source, `aba "${LABEL_TIPO_CUPOM[tipo]}"`).toBe(tipo)
      expect(inscricaoGravada().utm_content).toBe(codigo)
    }
  })
})
