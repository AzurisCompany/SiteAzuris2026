// Runner genérico de migration SQL.
// Uso: node sql/run-migration.mjs <arquivo.sql> [--env=.env.local]
// Lê POSTGRES_URL/DATABASE_URL do arquivo de env (default .env.local).

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
const envArg = args.find((a) => a.startsWith('--env='))
const envFile = envArg ? envArg.slice('--env='.length) : '.env.local'

if (!file) {
  console.error('Uso: node sql/run-migration.mjs <arquivo.sql> [--env=.env.local]')
  process.exit(1)
}

const env = Object.fromEntries(
  readFileSync(envFile, 'utf-8')
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
  console.error(`Nenhuma POSTGRES_URL/DATABASE_URL em ${envFile}`)
  process.exit(1)
}

const sql = neon(url)
const schema = readFileSync(file, 'utf-8')
  .replace(/--[^\n]*/g, '') // remove comentários (linha inteira e inline)
const statements = schema
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0)

console.log(`[${envFile}] Executando ${statements.length} statements de ${file}...\n`)

let ok = 0
for (const stmt of statements) {
  const truncated = stmt.replace(/\s+/g, ' ').slice(0, 72)
  try {
    await sql.query(stmt)
    ok++
    console.log('✅', truncated)
  } catch (e) {
    console.log('❌', truncated)
    console.log('   →', e.message)
  }
}

console.log(`\n${ok}/${statements.length} statements OK.`)
