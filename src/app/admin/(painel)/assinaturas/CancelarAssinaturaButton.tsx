'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelarAssinaturaButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function cancelar() {
    if (!confirm('Cancelar esta assinatura? Para de gerar novas cobranças no Asaas.')) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancelar', id }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={cancelar}
      disabled={loading}
      className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
    >
      {loading ? '…' : 'cancelar'}
    </button>
  )
}
