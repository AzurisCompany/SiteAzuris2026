import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { motivoPedidoNota, situacaoNota, SQL_NOTA, type LinhaNota } from '@/lib/nota-fiscal'

// Captura o SQL que a lista de vendas manda pro banco, sem banco.
const queries: string[] = []
let falharCom: string | null = null
vi.mock('@/lib/db', () => ({
  sql: Object.assign(() => Promise.resolve([]), {
    query: (q: string) => {
      queries.push(q)
      if (falharCom) return Promise.reject(new Error(falharCom))
      return Promise.resolve([{ c: '3' }])
    },
  }),
  PRECO_POR_PERFIL: {},
}))

const { listarVendas, contarNotasAEmitir } = await import('@/lib/admin-queries')

const RAIZ = join(__dirname, '../../..')
const ler = (p: string) => readFileSync(join(RAIZ, p), 'utf8')

const base: LinhaNota = {
  cpf_cnpj: '52998224725',
  pessoa_tipo: 'PF',
  nf_endereco: null,
  status: 'paid',
  valor_centavos: 67000,
  nf_status: null,
  nf_emitida_em: null,
}
const endereco = { cep: '80000000', logradouro: 'Rua X', numero: '1', bairro: 'Centro', cidade: 'Curitiba', uf: 'PR' }

describe('quem pediu nota fiscal', () => {
  it('PF sem endereço não pediu', () => {
    expect(motivoPedidoNota(base)).toBeNull()
    expect(situacaoNota(base)).toBe('nao_pediu')
  })

  it('PF com endereço marcou a caixinha', () => {
    expect(motivoPedidoNota({ ...base, nf_endereco: endereco })).toBe('endereco')
  })

  it('endereço só com strings vazias não conta', () => {
    expect(motivoPedidoNota({ ...base, nf_endereco: { cep: '', uf: ' ' } })).toBeNull()
  })

  it('CNPJ pediu, mesmo com pessoa_tipo NULL (venda anterior a 17/07)', () => {
    expect(motivoPedidoNota({ ...base, cpf_cnpj: '11.222.333/0001-81', pessoa_tipo: null })).toBe('cnpj')
  })

  it('pessoa_tipo PJ pediu', () => {
    expect(motivoPedidoNota({ ...base, pessoa_tipo: 'PJ' })).toBe('cnpj')
  })
})

describe('situação da nota', () => {
  const pj = { ...base, cpf_cnpj: '11222333000181', pessoa_tipo: 'PJ' as const }

  it('pediu e pagou → a emitir', () => {
    expect(situacaoNota(pj)).toBe('a_emitir')
  })

  it('pediu e não pagou → aguardando pagamento', () => {
    expect(situacaoNota({ ...pj, status: 'pending' })).toBe('aguardando_pagamento')
    expect(situacaoNota({ ...pj, status: 'refunded' })).toBe('aguardando_pagamento')
  })

  it('venda gratuita nunca fica "a emitir"', () => {
    expect(situacaoNota({ ...pj, valor_centavos: 0 })).toBe('aguardando_pagamento')
  })

  it('marcada à mão ou autorizada no Asaas → emitida', () => {
    expect(situacaoNota({ ...pj, nf_emitida_em: '2026-09-15T10:00:00Z' })).toBe('emitida')
    expect(situacaoNota({ ...pj, nf_status: 'AUTHORIZED' })).toBe('emitida')
  })

  it('nota do Asaas com erro ou cancelada continua a emitir', () => {
    expect(situacaoNota({ ...pj, nf_status: 'ERROR' })).toBe('a_emitir')
    expect(situacaoNota({ ...pj, nf_status: 'CANCELED' })).toBe('a_emitir')
  })

  it('antes da migração (campo ausente) nada quebra', () => {
    const { nf_emitida_em: _, ...semCampo } = pj
    expect(situacaoNota(semCampo)).toBe('a_emitir')
  })
})

describe('espelho SQL', () => {
  it('é NULL-safe: sem COALESCE, o NOT do "não pediu" some com a linha', () => {
    expect(SQL_NOTA.pediu).toContain("COALESCE(pessoa_tipo, '') = 'PJ'")
    expect(SQL_NOTA.pediu).toContain("COALESCE(cpf_cnpj, '')")
    expect(SQL_NOTA.emitida).toContain("COALESCE(nf_status, '') = 'AUTHORIZED'")
  })

  it('"a emitir" exige pago, valor > 0 e nota ausente — igual ao TS', () => {
    expect(SQL_NOTA.a_emitir).toContain("status = 'paid'")
    expect(SQL_NOTA.a_emitir).toContain('valor_centavos > 0')
    expect(SQL_NOTA.a_emitir).toContain(`NOT ${SQL_NOTA.emitida}`)
  })
})

describe('nf_emitida_em — migração segura', () => {
  const COLUNA = /ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_emitida_em TIMESTAMPTZ(?! NOT NULL)/

  beforeEach(() => {
    queries.length = 0
    falharCom = null
  })

  it('a rota de migração e o espelho SQL criam a coluna, nullable e idempotente', () => {
    expect(ler('src/app/api/admin/migrate/route.ts')).toMatch(COLUNA)
    expect(ler('sql/admin-migration.sql')).toMatch(COLUNA)
  })

  it('a lista sem filtro de nota não toca a coluna — fica de pé entre deploy e migração', async () => {
    await listarVendas({})
    expect(queries.join('\n')).not.toContain('nf_emitida_em')
  })

  it('o filtro de nota entra no WHERE', async () => {
    await listarVendas({ nf: 'a_emitir' })
    expect(queries[0]).toContain('nf_emitida_em')
  })

  it('filtro de nota desconhecido é ignorado, não vira SQL', async () => {
    await listarVendas({ nf: "'; DROP TABLE inscricoes; --" })
    expect(queries.join('\n')).not.toContain('DROP')
  })

  it('o contador "NF a emitir" devolve null antes da migração em vez de derrubar a página', async () => {
    falharCom = 'column "nf_emitida_em" does not exist'
    await expect(contarNotasAEmitir({})).resolves.toBeNull()
  })

  it('o contador ignora o filtro de nota que estiver aberto', async () => {
    expect(await contarNotasAEmitir({ nf: 'emitida' })).toBe(3)
    expect(queries[0]).toContain("status = 'paid'")
  })

  it('outro erro de banco no contador não é engolido', async () => {
    falharCom = 'connection refused'
    await expect(contarNotasAEmitir({})).rejects.toThrow('connection refused')
  })
})
