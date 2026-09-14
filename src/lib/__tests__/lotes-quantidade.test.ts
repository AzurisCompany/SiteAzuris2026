import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TipoIngresso } from '@/lib/tipos-ingresso'

const listarTipos = vi.fn<(p: string) => Promise<TipoIngresso[]>>()
const contarInscritosPorTipo = vi.fn<(p: string) => Promise<Record<string, number>>>()

vi.mock('@/lib/tipos-ingresso', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/tipos-ingresso')>()),
  listarTipos: (p: string) => listarTipos(p),
  contarInscritosPorTipo: (p: string) => contarInscritosPorTipo(p),
  getTipo: async (p: string, t: string) => (await listarTipos(p)).find((x) => x.tipo_id === t) ?? null,
}))
vi.mock('@/lib/db', () => ({ sql: () => Promise.resolve([]) }))

const { escadaPorQuantidade } = await import('@/lib/lotes-quantidade')
const { processarCheckout } = await import('@/lib/checkout-produto')
const { PRODUTOS } = await import('@/lib/produtos')

const RAIZ = join(__dirname, '../../..')
const HOJE = '2026-09-14'

function lote(produto: string, n: number, preco: number, limite: number, over: Partial<TipoIngresso> = {}): TipoIngresso {
  return {
    id: n,
    produto_slug: produto,
    tipo_id: `lote-${n}`,
    nome: `Lote ${n}`,
    descricao: null,
    preco_centavos: preco,
    preco_de_centavos: 0,
    pix_desconto_pct: 0,
    cartao_acrescimo_pct: 0,
    max_parcelas: 3,
    ativo: true,
    oculto: false,
    ordem: n - 1,
    vendas_ate: null,
    limite_qtd: limite,
    ...over,
  }
}

const VIP = [lote('dss-vip-2026', 1, 95700, 10), lote('dss-vip-2026', 2, 127500, 15), lote('dss-vip-2026', 3, 165700, 15)]

describe('escadaPorQuantidade', () => {
  it('com o Lote 1 aberto, vende o Lote 1 e mostra os outros como "em breve"', () => {
    const e = escadaPorQuantidade(VIP, { 'lote-1': 3 }, HOJE)
    expect(e.vigente?.tipo_id).toBe('lote-1')
    expect(e.restantes).toBe(7)
    expect(e.degraus.map((d) => d.estado)).toEqual(['atual', 'proximo', 'proximo'])
  })

  it('o 10º ingresso do Lote 1 vira a página pro Lote 2 sozinha', () => {
    const e = escadaPorQuantidade(VIP, { 'lote-1': 10 }, HOJE)
    expect(e.vigente?.tipo_id).toBe('lote-2')
    expect(e.vigente?.preco_centavos).toBe(127500)
    expect(e.restantes).toBe(15)
    expect(e.degraus.map((d) => d.estado)).toEqual(['encerrado', 'atual', 'proximo'])
  })

  it('tudo vendido = esgotado, sem lote vigente', () => {
    const e = escadaPorQuantidade(VIP, { 'lote-1': 10, 'lote-2': 15, 'lote-3': 15 }, HOJE)
    expect(e.vigente).toBeNull()
    expect(e.esgotado).toBe(true)
  })

  it('sem catálogo (migração não rodou) não é "esgotado"', () => {
    const e = escadaPorQuantidade([], {}, HOJE)
    expect(e.vigente).toBeNull()
    expect(e.esgotado).toBe(false)
  })

  it('lote desligado no admin é pulado — e sai da escada', () => {
    const e = escadaPorQuantidade([VIP[0], { ...VIP[1], ativo: false }, VIP[2]], { 'lote-1': 10 }, HOJE)
    expect(e.vigente?.tipo_id).toBe('lote-3')
    expect(e.degraus).toHaveLength(2)
  })
})

describe('processarCheckout — VIP/Business só vendem o lote vigente', () => {
  const body = {
    nome: 'Fulano de Tal',
    email: 'fulano@exemplo.com',
    telefone: '41999998888',
    cpf_cnpj: '00000000000', // inválido de propósito: passar do portão do lote e parar antes do Asaas
    consentimento: true,
    billing_type: 'PIX' as const,
  }

  beforeEach(() => {
    listarTipos.mockResolvedValue(VIP)
    contarInscritosPorTipo.mockResolvedValue({})
  })

  it('POST sem tipo é recusado — o fallback do registry é o preço do Lote 1', async () => {
    const r = await processarCheckout('dss-vip-2026', body)
    expect(r.status).toBe(400)
  })

  it('Lote 1 esgotado: quem ainda tinha a página velha recebe o motivo e o lote novo', async () => {
    contarInscritosPorTipo.mockResolvedValue({ 'lote-1': 10 })
    const r = await processarCheckout('dss-vip-2026', { ...body, tipo: 'lote-1' })
    expect(r.status).toBe(409)
    expect(String(r.body.error)).toContain('Lote 2')
  })

  it('não dá pra comprar lote à frente do vigente', async () => {
    const r = await processarCheckout('dss-vip-2026', { ...body, tipo: 'lote-3' })
    expect(r.status).toBe(409)
  })

  it('tudo vendido: 409 esgotado', async () => {
    contarInscritosPorTipo.mockResolvedValue({ 'lote-1': 10, 'lote-2': 15, 'lote-3': 15 })
    const r = await processarCheckout('dss-vip-2026', { ...body, tipo: 'lote-3' })
    expect(r).toEqual({ status: 409, body: { error: 'Ingressos esgotados' } })
  })

  it('lote vigente passa do portão (e segue pras validações de pagamento)', async () => {
    const r = await processarCheckout('dss-vip-2026', { ...body, tipo: 'lote-1' })
    expect(r.body.error).toMatch(/CPF\/CNPJ inválido/)
  })
})

describe('canário — os lotes combinados em 14/09', () => {
  const migracao = readFileSync(join(RAIZ, 'src/app/api/admin/migrate/route.ts'), 'utf8')
  const espelho = readFileSync(join(RAIZ, 'sql/admin-migration.sql'), 'utf8')

  const ESPERADO: Record<string, Array<[string, number, number]>> = {
    // [tipo_id, preço em centavos, vagas]
    'dss-vip-2026': [['lote-1', 95700, 10], ['lote-2', 127500, 15], ['lote-3', 165700, 15]],
    'dss-business-2026': [['lote-1', 75700, 10], ['lote-2', 98400, 10], ['lote-3', 127900, 10]],
  }

  for (const [slug, lotes] of Object.entries(ESPERADO)) {
    it(`${slug}: migração e espelho SQL semeiam os 3 lotes com preço e vagas certos, sem prazo`, () => {
      for (const fonte of [migracao, espelho]) {
        const linhas = fonte.split('\n').filter((l) => l.includes(`('${slug}'`))
        expect(linhas, `${slug}: esperava 3 lotes`).toHaveLength(3)
        for (const [tipo, preco, vagas] of lotes) {
          const linha = linhas.find((l) => l.includes(`'${tipo}'`))
          expect(linha, `${slug}/${tipo} ausente`).toBeTruthy()
          expect(linha).toMatch(new RegExp(`, ${preco}, 3, \\d, NULL, ${vagas}\\)`))
        }
      }
    })

    it(`${slug}: registry exige tipo e o fallback é o Lote 1`, () => {
      expect(PRODUTOS[slug].tipoObrigatorio).toBe(true)
      expect(PRODUTOS[slug].precoCentavos).toBe(lotes[0][1])
    })
  }
})
