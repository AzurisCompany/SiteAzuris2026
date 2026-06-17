// Poll GA4 Data API até o 403 "API not enabled" sumir. Descartável.
import { createSign } from 'node:crypto'

const sa = JSON.parse(process.env.GA_SERVICE_ACCOUNT_JSON)
const pid = process.env.GA4_PROPERTY_ID

async function token() {
  const now = Math.floor(Date.now() / 1000)
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const h = b64({ alg: 'RS256', typ: 'JWT' })
  const c = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })
  const s = createSign('RSA-SHA256'); s.update(`${h}.${c}`)
  const jwt = `${h}.${c}.${s.sign(sa.private_key, 'base64url')}`
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) })
  return (await r.json()).access_token
}

async function tryReport() {
  const t = await token()
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${pid}:runReport`, { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }], metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }] }) })
  return { status: r.status, body: await r.text() }
}

const maxTries = 20
for (let i = 1; i <= maxTries; i++) {
  const { status, body } = await tryReport()
  const ts = new Date().toISOString().slice(11, 19)
  if (status === 200) {
    const d = JSON.parse(body); const m = d.rows?.[0]?.metricValues ?? []
    console.log(`[${ts}] #${i} 200 ✅ ONLINE — usuarios=${m[0]?.value} sessoes=${m[1]?.value} pageviews=${m[2]?.value}`)
    process.exit(0)
  }
  const notEnabled = body.includes('has not been used in project') || body.includes('it is disabled')
  if (status === 403 && !notEnabled) {
    console.log(`[${ts}] #${i} 403 OUTRO — provável falta de permissão (Leitor do SA na propriedade). Detalhe:`)
    console.log(body.slice(0, 500))
    process.exit(2)
  }
  console.log(`[${ts}] #${i} ${status} — API ainda não habilitada/propagando. Retry em 45s.`)
  await new Promise((r) => setTimeout(r, 45_000))
}
console.log('Esgotou as tentativas — API ainda não propagou. Rode de novo.')
process.exit(3)
