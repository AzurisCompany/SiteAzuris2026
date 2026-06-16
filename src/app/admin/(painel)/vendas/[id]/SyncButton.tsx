'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SyncButton({ id }: { id: number }) {
  const router = useRouter()
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'erro'>('idle')
  const [msg, setMsg] = useState<string | null>(null)

  async function sincronizar() {
    setEstado('loading')
    setMsg(null)
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setEstado('erro')
        setMsg(data?.error ?? 'Falha ao sincronizar.')
        return
      }
      setEstado('ok')
      setMsg(`Status no Asaas: ${data.status}`)
      router.refresh()
    } catch {
      setEstado('erro')
      setMsg('Erro de rede.')
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={sincronizar}
        disabled={estado === 'loading'}
        className="rounded-lg border border-[var(--azuris-cyan)]/40 bg-[var(--azuris-cyan)]/10 px-4 py-2 text-sm font-semibold text-[var(--azuris-cyan)] hover:bg-[var(--azuris-cyan)]/20 disabled:opacity-60"
      >
        {estado === 'loading' ? 'Sincronizando…' : '↻ Sincronizar com Asaas'}
      </button>
      {msg && (
        <span className={`text-sm ${estado === 'erro' ? 'text-red-300' : 'text-[var(--text-muted)]'}`}>{msg}</span>
      )}
    </div>
  )
}
