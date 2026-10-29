import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TipoIngresso } from '@/lib/tipos-ingresso'

// PIX na tela ([[produtos]] `pixNaTela`): o Pre-Load do DSS 2027 devolve o QR Code da
// cobrança junto da resposta; falha no QR não derruba a venda (cai na fatura).
const criarCobranca = vi.fn()
const getPixQrCode = vi.fn()
let inscritos: Record<string, number> = {}

const TIPO: TipoIngresso = {
  id: 1,
  produto_slug: 'dss-2027-preload',
  tipo_id: 'fullpass-preload',
  nome: 'FullPass Pre-Load',
  descricao: 'FullPass DSS 2027',
  preco_centavos: 55000,
  preco_de_centavos: 0,
  pix_desconto_pct: 0,
  cartao_acrescimo_pct: 0,
  max_parcelas: 3,
  ativo: true,
  oculto: false,
  ordem: 0,
  vendas_ate: null,
  limite_qtd: 50,
}

vi.mock('@/lib/tipos-ingresso', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/tipos-ingresso')>()),
  getTipo: async () => TIPO,
  listarTipos: async () => [TIPO],
  contarInscritosPorTipo: async () => inscritos,
}))
vi.mock('@/lib/db', () => ({
  buscarCompraPagaDoDocumento: async () => null,
  sql: () => Promise.resolve([]),
}))
vi.mock('@/lib/cupons', () => ({
  resolverDesconto: async () => ({ aplicado: null }),
  aplicarDesconto: (c: number) => c,
}))
vi.mock('@/lib/cobranca-pipeline', () => ({ criarCobranca: (...a: unknown[]) => criarCobranca(...a) }))
vi.mock('@/lib/asaas', () => ({ getPixQrCode: (...a: unknown[]) => getPixQrCode(...a) }))

const { processarCheckout } = await import('@/lib/checkout-produto')

const body = {
  nome: 'Fulano de Tal',
  email: 'fulano@exemplo.com',
  telefone: '41999998888',
  cpf_cnpj: '52998224725',
  tipo: 'fullpass-preload',
  consentimento: true,
  billing_type: 'PIX' as const,
}

describe('processarCheckout — Pre-Load DSS 2027 (PIX na tela)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    inscritos = {}
    criarCobranca.mockResolvedValue({
      tipo: 'criada',
      inscricaoId: 7,
      payment: { id: 'pay_abc', invoiceUrl: 'https://asaas/i/abc' },
    })
    getPixQrCode.mockResolvedValue({ encodedImage: 'iVBOR', payload: '000201...', expirationDate: '2026-11-01 23:59:59' })
  })

  it('PIX: cobra R$550 e devolve o QR Code da própria cobrança', async () => {
    const r = await processarCheckout('dss-2027-preload', body)
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({
      paymentId: 'pay_abc',
      valor: 550,
      pix: { qrCodeBase64: 'iVBOR', copiaECola: '000201...' },
    })
    expect(getPixQrCode).toHaveBeenCalledWith('pay_abc')
    const arg = criarCobranca.mock.calls[0][0]
    expect(arg.asaas).toMatchObject({ billingType: 'PIX', valueReais: 550 })
    // a duplicada tem que ser do mesmo meio — cartão 1x tem o mesmo valor
    expect(arg.dedupe).toMatchObject({ billing_type: 'PIX', tipo_ingresso: 'fullpass-preload' })
  })

  it('QR indisponível não derruba a venda: sem `pix`, o navegador vai pra fatura', async () => {
    getPixQrCode.mockRejectedValue(new Error('Asaas 500'))
    const r = await processarCheckout('dss-2027-preload', body)
    expect(r.status).toBe(200)
    expect(r.body.invoiceUrl).toBe('https://asaas/i/abc')
    expect(r.body).not.toHaveProperty('pix')
  })

  it('cartão: 3x com juros sobre R$550, sem QR', async () => {
    const r = await processarCheckout('dss-2027-preload', { ...body, billing_type: 'CREDIT_CARD', installments: 3 })
    expect(r.status).toBe(200)
    expect(getPixQrCode).not.toHaveBeenCalled()
    const { asaas } = criarCobranca.mock.calls[0][0]
    expect(asaas.installmentCount).toBe(3)
    expect(asaas.valueReais).toBeGreaterThan(550)
  })

  it('o 51º é recusado: 50 pagos + pendentes esgotam o Pre-Load', async () => {
    inscritos = { 'fullpass-preload': 50 }
    const r = await processarCheckout('dss-2027-preload', body)
    expect(r.status).toBe(409)
    expect(criarCobranca).not.toHaveBeenCalled()
  })
})
