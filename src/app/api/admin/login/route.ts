// POST /api/admin/login  → valida senha, seta cookie de sessão.
// DELETE /api/admin/login → logout (limpa cookie).

import { NextResponse } from 'next/server'
import { senhaConfere, criarToken, ADMIN_COOKIE, COOKIE_MAX_AGE } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { senha?: string }
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD não configurada no servidor.' }, { status: 500 })
  }
  if (!senhaConfere(body.senha ?? '')) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, criarToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
