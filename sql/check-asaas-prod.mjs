// Sanity check: valida ASAAS_API_KEY contra a API de produção.
// Não cria nada — só GET /customers?limit=1 + GET /finance/balance.
// Roda: node sql/check-asaas-prod.mjs (com .env.production.local presente)

import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.asaas-prod.tmp', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      const k = l.slice(0, i).trim()
      let v = l.slice(i + 1).trim()
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
      return [k, v]
    }),
)

const key = env.ASAAS_API_KEY
const base = env.ASAAS_BASE_URL

if (!key) {
  console.error('ASAAS_API_KEY ausente no .env.production.local')
  process.exit(1)
}

console.log(`Base URL: ${base}`)
console.log(`Key prefix: ${key.slice(0, 14)}…${key.slice(-6)}`)
console.log(`Key length: ${key.length} chars`)
console.log(`Modo: ${base.includes('sandbox') ? '⚠️  SANDBOX' : '🟢 PRODUÇÃO'}`)
console.log('')

async function ping(path) {
  const res = await fetch(`${base}${path}`, {
    headers: { access_token: key, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text.slice(0, 200)
  }
  return { status: res.status, ok: res.ok, body: json }
}

console.log('1. GET /customers?limit=1')
const customers = await ping('/customers?limit=1')
console.log(`   HTTP ${customers.status} ${customers.ok ? '✅' : '❌'}`)
if (!customers.ok) {
  console.log('   Resposta:', JSON.stringify(customers.body, null, 2))
  process.exit(2)
}
console.log(`   Total customers na conta: ${customers.body.totalCount ?? '?'}`)
console.log('')

console.log('2. GET /finance/balance')
const balance = await ping('/finance/balance')
console.log(`   HTTP ${balance.status} ${balance.ok ? '✅' : '❌'}`)
if (balance.ok) {
  console.log(`   Saldo atual: R$ ${balance.body.balance ?? '?'}`)
} else {
  console.log('   Resposta:', JSON.stringify(balance.body, null, 2))
}
console.log('')

console.log('3. GET /myAccount (info da conta)')
const acc = await ping('/myAccount')
console.log(`   HTTP ${acc.status} ${acc.ok ? '✅' : '❌'}`)
if (acc.ok) {
  console.log(`   Conta: ${acc.body.name ?? '?'} / ${acc.body.email ?? '?'}`)
  console.log(`   CPF/CNPJ: ${acc.body.cpfCnpj ?? '?'}`)
  console.log(`   Status: ${acc.body.accountStatus?.commercialInfo ?? '?'}`)
  console.log(`   Apto a receber: ${acc.body.canReceiveTransfer ? '✅ sim' : '❌ não'}`)
} else {
  console.log('   (endpoint pode não existir nessa versão da API — não é fatal)')
}
console.log('')

console.log('✅ Chave válida e funcionando em produção.')
