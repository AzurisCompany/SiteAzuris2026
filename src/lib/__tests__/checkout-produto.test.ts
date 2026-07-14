import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TipoIngresso } from '@/lib/tipos-ingresso'

// Mocks dos dois efeitos colaterais do fluxo gratuito: leitura do tipo e escrita
// da inscrição. Regras puras (ehGratuito, disponibilidadeDoTipo) ficam reais.
const getTipo = vi.fn<(p: string, t: string) => Promise<TipoIngresso | null>>()
const buscarInscricaoGratuita = vi.fn()
const criarInscricaoPendente = vi.fn()
const confirmarInscricaoGratuita = vi.fn()

vi.mock('@/lib/tipos-ingresso', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/tipos-ingresso')>()),
  getTipo: (p: string, t: string) => getTipo(p, t),
  contarInscritosPorTipo: async () => ({}),
}))

vi.mock('@/lib/db', () => ({
  buscarInscricaoGratuita: (...a: unknown[]) => buscarInscricaoGratuita(...a),
  criarInscricaoPendente: (...a: unknown[]) => criarInscricaoPendente(...a),
  confirmarInscricaoGratuita: (...a: unknown[]) => confirmarInscricaoGratuita(...a),
  sql: () => Promise.resolve([]),
}))

const { processarCheckout } = await import('@/lib/checkout-produto')

const TIPO_RESERVA: TipoIngresso = {
  id: 1,
  produto_slug: 'preparatorio-dados',
  tipo_id: 'reserva',
  nome: 'Reserva de interesse',
  descricao: 'Sem pagamento — aviso na abertura e desconto de fundador',
  preco_centavos: 0,
  preco_de_centavos: 0,
  pix_desconto_pct: 0,
  cartao_acrescimo_pct: 0,
  max_parcelas: 1,
  ativo: true,
  ordem: 0,
  vendas_ate: null,
  limite_qtd: null,
}

const body = { nome: 'Fulano de Tal', email: 'Fulano@Exemplo.com', tipo: 'reserva', consentimento: true }

describe('processarCheckout — reserva do preparatório (gratuito)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getTipo.mockResolvedValue(TIPO_RESERVA)
    buscarInscricaoGratuita.mockResolvedValue(null)
    criarInscricaoPendente.mockResolvedValue({ id: 42 })
  })

  it('cria o lead sem CPF, sem telefone e sem Asaas', async () => {
    const r = await processarCheckout('preparatorio-dados', body)

    expect(r).toEqual({ status: 200, body: { ok: true, gratuito: true } })
    expect(criarInscricaoPendente).toHaveBeenCalledTimes(1)
    const insc = criarInscricaoPendente.mock.calls[0][0]
    expect(insc).toMatchObject({
      curso_slug: 'preparatorio-dados',
      tipo_ingresso: 'reserva',
      billing_type: 'GRATIS',
      valor_centavos: 0,
      cpf_cnpj: '',
      telefone: null,
      email: 'fulano@exemplo.com', // normalizado em minúsculas
      consentimento_lgpd: true,
    })
    expect(confirmarInscricaoGratuita).toHaveBeenCalledWith(42)
  })

  it('reserva duplicada pelo mesmo e-mail não cria outra inscrição', async () => {
    buscarInscricaoGratuita.mockResolvedValue({ id: 42, email: 'fulano@exemplo.com' })

    const r = await processarCheckout('preparatorio-dados', body)

    expect(r).toEqual({ status: 200, body: { ok: true, gratuito: true, duplicada: true } })
    expect(criarInscricaoPendente).not.toHaveBeenCalled()
    expect(confirmarInscricaoGratuita).not.toHaveBeenCalled()
  })

  it('propaga as UTMs pro lead', async () => {
    await processarCheckout('preparatorio-dados', { ...body, utm: { source: 'lakehouse', medium: 'landing' } })

    expect(criarInscricaoPendente.mock.calls[0][0]).toMatchObject({
      utm_source: 'lakehouse',
      utm_medium: 'landing',
      utm_campaign: null,
    })
  })

  it('exige consentimento LGPD e e-mail válido', async () => {
    expect(await processarCheckout('preparatorio-dados', { ...body, consentimento: false })).toMatchObject({ status: 400 })
    expect(await processarCheckout('preparatorio-dados', { ...body, email: 'nao-eh-email' })).toMatchObject({ status: 400 })
    expect(criarInscricaoPendente).not.toHaveBeenCalled()
  })

  it('aceita telefone quando vem, mas rejeita telefone malformado', async () => {
    await processarCheckout('preparatorio-dados', { ...body, telefone: '41999998888' })
    expect(criarInscricaoPendente.mock.calls[0][0]).toMatchObject({ telefone: '41999998888' })

    expect(await processarCheckout('preparatorio-dados', { ...body, telefone: '123' })).toMatchObject({ status: 400 })
  })

  it('produto que exige telefone continua rejeitando cadastro sem telefone', async () => {
    getTipo.mockResolvedValue({ ...TIPO_RESERVA, produto_slug: 'gubigdata-2026-07', tipo_id: 'associado' })

    const r = await processarCheckout('gubigdata-2026-07', { ...body, tipo: 'associado' })

    expect(r.status).toBe(400)
    expect(criarInscricaoPendente).not.toHaveBeenCalled()
  })
})
