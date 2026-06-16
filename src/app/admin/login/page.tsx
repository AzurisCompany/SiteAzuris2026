'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErro(data?.error ?? 'Falha ao entrar.')
        setEnviando(false)
        return
      }
      router.replace('/admin')
      router.refresh()
    } catch {
      setErro('Erro de rede. Tenta de novo.')
      setEnviando(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--azuris-ink)] text-[var(--text-primary)] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-8">
        <div>
          <h1 className="text-xl font-bold">Área financeira</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Acesso restrito. Informe a senha.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Senha</label>
          <input
            type="password"
            autoFocus
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2.5 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none"
          />
        </div>
        {erro && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-xl bg-[var(--azuris-cyan)] px-4 py-3 text-sm font-bold text-[var(--azuris-ink)] transition-all hover:brightness-110 disabled:opacity-60"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
