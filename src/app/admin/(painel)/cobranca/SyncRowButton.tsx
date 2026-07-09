'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/** Sincroniza UMA cobrança com o Asaas (reconcilia status/valor). */
export default function SyncRowButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function sincronizar() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={sincronizar}
      disabled={loading}
      title="Sincronizar status com o Asaas"
      className="rounded-lg border border-[var(--azuris-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--azuris-cyan)]/40 hover:text-[var(--azuris-cyan)] disabled:opacity-60"
    >
      {loading ? '…' : '↻ sync'}
    </button>
  )
}
