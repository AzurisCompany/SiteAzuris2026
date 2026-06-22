'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/** Marca/desmarca uma inscrição como registro de teste. Reusado na lista e no detalhe. */
export default function TesteButton({ id, isTeste }: { id: number; isTeste: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function alternar() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/inscricoes/teste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, teste: !isTeste }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={alternar}
      disabled={loading}
      title={isTeste ? 'Desmarcar como teste (volta pra lista)' : 'Marcar como teste (some da lista e dos KPIs)'}
      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
        isTeste
          ? 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
          : 'border-[var(--azuris-surface)] text-[var(--text-muted)] hover:border-amber-400/40 hover:text-amber-300'
      }`}
    >
      {loading ? '…' : isTeste ? '✓ teste' : 'marcar teste'}
    </button>
  )
}
