// Script utilitário pra rodar inscricoes-schema.sql no Postgres.
// Uso: node sql/run-schema.mjs
// Lê POSTGRES_URL de .env.local (gerado por `vercel env pull`).

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      const k = l.slice(0, i).trim()
      let v = l.slice(i + 1).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      return [k, v]
    })
)

const url = env.POSTGRES_URL || env.DATABASE_URL
if (!url) {
  console.error('Nenhuma POSTGRES_URL ou DATABASE_URL em .env.local')
  console.error('Chaves disponíveis:', Object.keys(env).filter((k) => k.includes('POSTGRES') || k.includes('DATABASE')))
  process.exit(1)
}

const sql = neon(url)
const schema = readFileSync('sql/inscricoes-schema.sql', 'utf-8')
const statements = schema
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith('--') && !/^\s*$/.test(s))

console.log(`Executando ${statements.length} statements...\n`)

for (const stmt of statements) {
  const truncated = stmt.replace(/\s+/g, ' ').slice(0, 70)
  try {
    await sql.query(stmt)
    console.log('✅', truncated)
  } catch (e) {
    console.log('❌', truncated)
    console.log('   →', e.message)
  }
}

const rows = await sql`SELECT COUNT(*) AS c FROM inscricoes`
console.log('\nTabela inscricoes pronta. Linhas:', rows[0].c)
