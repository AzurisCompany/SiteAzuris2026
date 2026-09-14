import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const RAIZ = join(__dirname, '../../..')
const ler = (p: string) => readFileSync(join(RAIZ, p), 'utf8')

const COLUNA = /ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS ingresso_gerado_em TIMESTAMPTZ(?! NOT NULL)/

describe('ingresso gerado — migração segura', () => {
  it('a rota de migração e o espelho SQL criam a coluna, nullable e idempotente', () => {
    expect(ler('src/app/api/admin/migrate/route.ts')).toMatch(COLUNA)
    expect(ler('sql/admin-migration.sql')).toMatch(COLUNA)
  })

  it('a migração continua 100% aditiva — nada que apague ou reescreva linha', () => {
    const migracao = ler('src/app/api/admin/migrate/route.ts')
    const statements = migracao.slice(migracao.indexOf('const STATEMENTS'), migracao.indexOf('export async function POST'))
    expect(statements).not.toMatch(/\b(DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+\w+\s+SET|ALTER\s+COLUMN|RENAME)\b/i)
  })

  it('a lista de vendas não depende da coluna — funciona entre o deploy e a migração', () => {
    // A lista lê via SELECT *: antes da migração o campo vem undefined e o botão mostra
    // "marcar gerado". Filtro/ORDER BY na coluna derrubaria a página inteira nessa janela.
    expect(ler('src/lib/admin-queries.ts')).not.toContain('ingresso_gerado_em')
  })
})
