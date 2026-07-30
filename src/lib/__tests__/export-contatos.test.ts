import { describe, it, expect } from 'vitest'
import { escaparCampo, montarCsv, montarCsvContatos, nomeArquivoCsv, BOM } from '@/lib/export-contatos'
import type { InscricaoRow } from '@/lib/db'

/** Linha mínima de inscrição — cada teste sobrescreve só o que importa. */
function linha(over: Partial<InscricaoRow> = {}): InscricaoRow {
  return {
    id: 1,
    curso_slug: 'dss-2026',
    lote: 'lote1',
    tipo_ingresso: null,
    nome: 'Fulano',
    email: 'fulano@exemplo.com',
    cpf_cnpj: '12345678901',
    telefone: '41999998888',
    billing_type: 'PIX',
    valor_centavos: 57000,
    installments: 1,
    status: 'pending',
    created_at: '2026-07-20T12:00:00Z',
    updated_at: '2026-07-20T12:00:00Z',
    paid_at: null,
    is_teste: false,
    consentimento_lgpd: true,
    ...over,
  } as InscricaoRow
}

/** Linhas de dados do CSV (sem BOM, sem cabeçalho, sem a linha vazia final). */
function corpo(csv: string): string[] {
  return csv.replace(BOM, '').trim().split('\r\n').slice(1)
}

describe('escaparCampo', () => {
  it('deixa passar campo simples', () => {
    expect(escaparCampo('Fulano')).toBe('Fulano')
  })
  it('põe entre aspas quando tem separador ou quebra de linha', () => {
    expect(escaparCampo('Silva; Souza')).toBe('"Silva; Souza"')
    expect(escaparCampo('linha1\nlinha2')).toBe('"linha1\nlinha2"')
  })
  it('não põe aspas por causa de vírgula — o separador é ;', () => {
    expect(escaparCampo('Silva, Souza')).toBe('Silva, Souza')
    expect(escaparCampo('570,00')).toBe('570,00')
  })
  it('dobra as aspas internas', () => {
    expect(escaparCampo('João "Jony"')).toBe('"João ""Jony"""')
  })
  it('null e undefined viram campo vazio', () => {
    expect(escaparCampo(null)).toBe('')
    expect(escaparCampo(undefined)).toBe('')
  })
  it('neutraliza injeção de fórmula do Excel', () => {
    // Nome vem digitado no checkout: sem o prefixo, o Excel executa isso.
    expect(escaparCampo('=1+1')).toBe("'=1+1")
    expect(escaparCampo('@SUM(A1)')).toBe("'@SUM(A1)")
    expect(escaparCampo('+55 41 9999')).toBe("'+55 41 9999")
    expect(escaparCampo('-cmd')).toBe("'-cmd")
  })
})

describe('montarCsv', () => {
  it('começa com BOM e separa por ponto-e-vírgula', () => {
    const csv = montarCsv(['a', 'b'], [['1', '2']])
    expect(csv.startsWith(BOM)).toBe(true)
    expect(csv).toContain('a;b\r\n1;2')
  })
})

describe('montarCsvContatos', () => {
  it('gera uma linha por contato com nome, email e telefone', () => {
    const csv = montarCsvContatos([linha({ nome: 'Ana', email: 'ana@x.com', telefone: '41988887777' })])
    const [l] = corpo(csv)
    expect(l).toContain('Ana;ana@x.com;41988887777;https://wa.me/5541988887777')
    expect(l).toContain('DSSBR 2026')
  })

  it('colapsa a mesma pessoa no mesmo produto e conta os registros', () => {
    const csv = montarCsvContatos([
      linha({ id: 2, email: 'ana@x.com', status: 'pending', created_at: '2026-07-20T12:00:00Z' }),
      linha({ id: 1, email: 'ANA@x.com', status: 'paid', created_at: '2026-06-01T12:00:00Z' }),
    ])
    const linhas = corpo(csv)
    expect(linhas).toHaveLength(1)
    expect(linhas[0].endsWith(';2')).toBe(true) // registros
  })

  it('marca pagou=sim quando qualquer registro colapsado está pago', () => {
    // A cobrança mais nova é a pendente; sem esse cuidado a pessoa sairia da
    // lista como se nunca tivesse comprado.
    const csv = montarCsvContatos([
      linha({ id: 2, status: 'pending', created_at: '2026-07-20T12:00:00Z' }),
      linha({ id: 1, status: 'paid', created_at: '2026-06-01T12:00:00Z' }),
    ])
    expect(corpo(csv)[0]).toContain(';sim;')
  })

  it('mantém a mesma pessoa uma vez por produto', () => {
    const csv = montarCsvContatos([
      linha({ curso_slug: 'dss-2026' }),
      linha({ curso_slug: 'dss-one-day-2026' }),
    ])
    expect(corpo(csv)).toHaveLength(2)
  })

  it('ignora registro sem email', () => {
    const csv = montarCsvContatos([linha({ email: '' }), linha({ email: '  ' })])
    expect(corpo(csv)).toHaveLength(0)
  })

  it('formata valor com vírgula decimal', () => {
    expect(corpo(montarCsvContatos([linha({ valor_centavos: 57000 })]))[0]).toContain(';570,00;')
  })
})

describe('nomeArquivoCsv', () => {
  it('usa o slug do produto e a data', () => {
    expect(nomeArquivoCsv('dss-2026', '2026-07-30')).toBe('contatos-dss-2026-2026-07-30.csv')
  })
  it('aba Todos vira "todos"', () => {
    expect(nomeArquivoCsv('', '2026-07-30')).toBe('contatos-todos-2026-07-30.csv')
  })
})
