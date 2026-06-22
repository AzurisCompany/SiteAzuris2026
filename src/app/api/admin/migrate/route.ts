// POST /api/admin/migrate (protegido) — roda a migration aditiva/idempotente da
// área financeira usando a POSTGRES_URL de runtime. Necessário porque as env vars
// do Neon vêm vazias no `vercel env pull` (marcadas como sensitive), então não dá
// pra rodar a migration de produção pela CLI local. Idempotente: seguro re-rodar.
//
// Espelha sql/admin-migration.sql — manter em sincronia.
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATEMENTS: string[] = [
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS empresa TEXT`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS cargo TEXT`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS pessoa_tipo TEXT`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS razao_social TEXT`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_endereco JSONB`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS como_conheceu TEXT`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS consentimento_lgpd BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS consentimento_em TIMESTAMPTZ`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS valor_liquido_centavos INTEGER`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS taxa_centavos INTEGER`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS due_date DATE`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS asaas_status TEXT`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS pago_em TIMESTAMPTZ`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ`,
  `CREATE TABLE IF NOT EXISTS asaas_eventos (
     id BIGSERIAL PRIMARY KEY,
     asaas_payment_id TEXT,
     event TEXT NOT NULL,
     payload JSONB NOT NULL,
     received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_asaas_eventos_payment ON asaas_eventos(asaas_payment_id)`,
  `CREATE INDEX IF NOT EXISTS idx_asaas_eventos_received ON asaas_eventos(received_at)`,
  `CREATE INDEX IF NOT EXISTS idx_inscricoes_curso_status ON inscricoes(curso_slug, status)`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS is_teste BOOLEAN NOT NULL DEFAULT false`,
  `CREATE INDEX IF NOT EXISTS idx_inscricoes_is_teste ON inscricoes(is_teste)`,
  // Recria a view de vagas excluindo registros de teste (não devem consumir vaga real).
  `CREATE OR REPLACE VIEW v_vagas_por_lote AS
     SELECT lote,
            COUNT(*) FILTER (WHERE status = 'paid')               AS pagas,
            COUNT(*) FILTER (WHERE status = 'pending')            AS pendentes,
            COUNT(*) FILTER (WHERE status IN ('paid','pending'))  AS reservadas
     FROM inscricoes
     WHERE curso_slug = 'lakehouse-comunidade' AND NOT is_teste
     GROUP BY lote`,
]

export async function POST() {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }
  const resultados: Array<{ stmt: string; ok: boolean; error?: string }> = []
  for (const stmt of STATEMENTS) {
    try {
      await sql.query(stmt)
      resultados.push({ stmt: stmt.slice(0, 60), ok: true })
    } catch (e) {
      resultados.push({ stmt: stmt.slice(0, 60), ok: false, error: e instanceof Error ? e.message : 'erro' })
    }
  }
  const okCount = resultados.filter((r) => r.ok).length
  return NextResponse.json({ ok: okCount === STATEMENTS.length, okCount, total: STATEMENTS.length, resultados })
}
