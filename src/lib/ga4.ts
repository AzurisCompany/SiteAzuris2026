// Cliente da GA4 Data API (runReport) via service account.
// Auth feita na mão (JWT RS256 → token OAuth) pra não puxar googleapis.
//
// Envs necessárias (Vercel + .env.local):
//   GA4_PROPERTY_ID         — ID numérico da propriedade GA4 (NÃO o GT-...)
//   GA_SERVICE_ACCOUNT_JSON — JSON cru da chave do service account (client_email + private_key)
//
// O service account precisa de papel "Leitor" (Viewer) na propriedade GA4.

import { createSign } from 'node:crypto'

let tokenCache: { token: string; exp: number } | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 30_000) return tokenCache.token

  const raw = process.env.GA_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GA_SERVICE_ACCOUNT_JSON não configurada')
  const sa = JSON.parse(raw) as { client_email: string; private_key: string }

  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  ).toString('base64url')

  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claim}`)
  const sig = signer.sign(sa.private_key, 'base64url')
  const jwt = `${header}.${claim}.${sig}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`OAuth ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

interface ReportRow {
  dimensionValues?: Array<{ value: string }>
  metricValues?: Array<{ value: string }>
}

async function runReport(body: Record<string, unknown>): Promise<{ rows?: ReportRow[] }> {
  const pid = process.env.GA4_PROPERTY_ID
  if (!pid) throw new Error('GA4_PROPERTY_ID não configurada')
  const token = await getAccessToken()
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${pid}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`GA4 ${res.status}: ${await res.text()}`)
  return res.json()
}

const range = (dias: number) => [{ startDate: `${dias}daysAgo`, endDate: 'today' }]

export interface ResumoTrafego {
  usuarios: number
  sessoes: number
  pageviews: number
  engajamento: number // % de sessões engajadas
}

export async function resumoTrafego(dias: number): Promise<ResumoTrafego> {
  const r = await runReport({
    dateRanges: range(dias),
    metrics: [
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'engagementRate' },
    ],
  })
  const m = r.rows?.[0]?.metricValues ?? []
  return {
    usuarios: Number(m[0]?.value ?? 0),
    sessoes: Number(m[1]?.value ?? 0),
    pageviews: Number(m[2]?.value ?? 0),
    engajamento: Math.round(Number(m[3]?.value ?? 0) * 100),
  }
}

export interface LinhaDim {
  label: string
  sessoes: number
}

async function porDimensao(dias: number, dimension: string, limit: number): Promise<LinhaDim[]> {
  const r = await runReport({
    dateRanges: range(dias),
    dimensions: [{ name: dimension }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit,
  })
  return (r.rows ?? []).map((row) => ({
    label: row.dimensionValues?.[0]?.value ?? '(sem valor)',
    sessoes: Number(row.metricValues?.[0]?.value ?? 0),
  }))
}

/** Origem por canal (Organic Search, Direct, Referral, Social, …). */
export function origensPorCanal(dias: number): Promise<LinhaDim[]> {
  return porDimensao(dias, 'sessionDefaultChannelGroup', 10)
}

/** Origem detalhada por source/medium (google/organic, linkedin.com/referral, …). */
export function origensPorFonte(dias: number): Promise<LinhaDim[]> {
  return porDimensao(dias, 'sessionSourceMedium', 10)
}

export interface PaginaView {
  path: string
  views: number
}

export async function topPaginas(dias: number): Promise<PaginaView[]> {
  const r = await runReport({
    dateRanges: range(dias),
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 15,
  })
  return (r.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? '/',
    views: Number(row.metricValues?.[0]?.value ?? 0),
  }))
}
