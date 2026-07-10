'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/** Importa UMA cobrança do Asaas (por id) como inscrição no bucket avulso. */
export default function ImportarButton({ asaasPaymentId }: { asaasPaymentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function importar() {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch('/api/admin/importar-cobranca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asaas_payment_id: asaasPaymentId }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (res.ok) {
        router.refresh()
      } else {
        setErro(data.error ?? 'falha ao importar')
      }
    } catch {
      setErro('erro de rede')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={importar}
        disabled={loading}
        className="rounded-lg border border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent-emerald)] transition-colors hover:bg-[var(--accent-emerald)]/20 disabled:opacity-60"
      >
        {loading ? 'importando…' : '↓ Importar'}
      </button>
      {erro && <span className="text-xs text-red-300">{erro}</span>}
    </div>
  )
}
