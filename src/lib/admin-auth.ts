// Auth da área admin — senha única (ADMIN_PASSWORD) + cookie de sessão assinado.
// Sem tabela de sessão: o cookie é um token { exp } assinado com HMAC-SHA256.
// Segredo = ADMIN_SESSION_SECRET (recomendado) com fallback pra ADMIN_PASSWORD.
// Verificação roda em runtime nodejs (Server Components/route handlers).

import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'

export const ADMIN_COOKIE = 'azuris_admin'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ''
}

function sign(data: string): string {
  return createHmac('sha256', secret()).update(data).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

/** Compara a senha enviada com ADMIN_PASSWORD (timing-safe). */
export function senhaConfere(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? ''
  if (!expected) return false
  return safeEqual(input, expected)
}

/** Cria o token de sessão assinado. */
export function criarToken(): string {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + COOKIE_MAX_AGE * 1000 })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

/** Valida assinatura + expiração de um token. */
export function tokenValido(token: string | undefined | null): boolean {
  if (!token) return false
  const dot = token.lastIndexOf('.')
  if (dot < 1) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!safeEqual(sig, sign(payload))) return false
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp?: number }
    return typeof parsed.exp === 'number' && parsed.exp > Date.now()
  } catch {
    return false
  }
}

/** True se o request atual tem cookie de sessão válido. */
export async function estaLogado(): Promise<boolean> {
  const jar = await cookies()
  return tokenValido(jar.get(ADMIN_COOKIE)?.value)
}
