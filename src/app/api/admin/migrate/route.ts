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
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS tipo_ingresso TEXT`,
  `CREATE INDEX IF NOT EXISTS idx_inscricoes_tipo ON inscricoes(curso_slug, tipo_ingresso)`,
  `CREATE TABLE IF NOT EXISTS tipos_ingresso (
     id                   BIGSERIAL PRIMARY KEY,
     produto_slug         TEXT NOT NULL,
     tipo_id              TEXT NOT NULL,
     nome                 TEXT NOT NULL,
     descricao            TEXT,
     preco_centavos       INTEGER NOT NULL,
     preco_de_centavos    INTEGER NOT NULL DEFAULT 0,
     pix_desconto_pct     NUMERIC NOT NULL DEFAULT 0,
     cartao_acrescimo_pct NUMERIC NOT NULL DEFAULT 0,
     max_parcelas         INTEGER NOT NULL DEFAULT 1,
     ativo                BOOLEAN NOT NULL DEFAULT true,
     ordem                INTEGER NOT NULL DEFAULT 0,
     created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_tipos_ingresso_uq ON tipos_ingresso(produto_slug, tipo_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tipos_ingresso_ativo ON tipos_ingresso(produto_slug, ativo, ordem)`,
  // Config financeira editável no admin (meta mensal, alíquota de imposto).
  `CREATE TABLE IF NOT EXISTS config_financeiro (
     chave      TEXT PRIMARY KEY,
     valor      TEXT NOT NULL,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  // Assinaturas (cobrança recorrente). Cada ciclo cobrado vira uma linha em inscricoes.
  `CREATE TABLE IF NOT EXISTS assinaturas (
     id                     BIGSERIAL PRIMARY KEY,
     asaas_subscription_id  TEXT UNIQUE,
     asaas_customer_id      TEXT,
     nome                   TEXT NOT NULL,
     email                  TEXT NOT NULL,
     cpf_cnpj               TEXT NOT NULL,
     telefone               TEXT,
     billing_type           TEXT NOT NULL,
     valor_centavos         INTEGER NOT NULL,
     cycle                  TEXT NOT NULL,
     descricao              TEXT,
     status                 TEXT NOT NULL DEFAULT 'active',
     is_teste               BOOLEAN NOT NULL DEFAULT false,
     created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  // Nota Fiscal (NFS-e emitida via Asaas) vinculada à inscrição.
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_id TEXT`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_status TEXT`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_numero TEXT`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_pdf_url TEXT`,
  `ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_xml_url TEXT`,
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
  const integridade = await snapshotIntegridade()
  return NextResponse.json({
    ok: okCount === STATEMENTS.length,
    okCount,
    total: STATEMENTS.length,
    resultados,
    integridade,
  })
}

/**
 * Snapshot de integridade (só leitura) — pra comparar ANTES e DEPOIS da migração e
 * provar que nenhuma linha se perdeu. Como a migração é 100% aditiva (ADD COLUMN /
 * CREATE TABLE / CREATE INDEX IF NOT EXISTS + CREATE OR REPLACE VIEW), a contagem de
 * `inscricoes` tem que ser idêntica antes e depois.
 */
async function snapshotIntegridade() {
  const contar = async (tabela: string): Promise<number | null> => {
    try {
      const r = (await sql.query(`SELECT COUNT(*)::int AS c FROM ${tabela}`)) as Array<{ c: number }>
      return r[0]?.c ?? 0
    } catch {
      return null // tabela ainda não existe (ex.: pré-migração)
    }
  }
  const colunasInscricoes = (await sql.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'inscricoes' ORDER BY column_name`
  )) as Array<{ column_name: string }>
  const cols = colunasInscricoes.map((r) => r.column_name)

  const [inscricoes, asaas_eventos, tipos_ingresso] = await Promise.all([
    contar('inscricoes'),
    contar('asaas_eventos'),
    contar('tipos_ingresso'),
  ])

  return {
    inscricoes, // ← tem que ser igual antes/depois
    asaas_eventos,
    tipos_ingresso, // null antes da migração; número (0+) depois
    tem_coluna_tipo_ingresso: cols.includes('tipo_ingresso'),
    total_colunas_inscricoes: cols.length,
  }
}

/** GET — só o snapshot de integridade, sem rodar nada. Use pra baseline antes da migração. */
export async function GET() {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, integridade: await snapshotIntegridade() })
}
