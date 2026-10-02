'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function fmtDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

/** Marca/desmarca o ingresso da inscrição como gerado. Reusado na lista e no detalhe. */
export default function IngressoGeradoButton({
  id,
  geradoEm,
  curto = false,
}: {
  id: number
  geradoEm: string | null | undefined
  /** Rótulo enxuto pra caber numa linha da lista. */
  curto?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const gerado = Boolean(geradoEm)

  async function alternar() {
    if (gerado && !confirm('Desmarcar o ingresso como gerado? A data da marcação se perde.')) return
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch('/api/admin/inscricoes/ingresso-gerado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, gerado: !gerado }),
      })
      if (res.ok) router.refresh()
      else setErro(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `erro ${res.status}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={alternar}
      disabled={loading}
      title={
        erro ??
        (gerado ? `Ingresso gerado em ${fmtDataHora(geradoEm!)} — clique pra desmarcar` : 'Marcar o ingresso como gerado')
      }
      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
        erro
          ? 'border-red-500/40 bg-red-500/10 text-red-300'
          : gerado
            ? 'border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)]/20'
            : 'border-[var(--azuris-surface)] text-[var(--text-muted)] hover:border-[var(--accent-emerald)]/40 hover:text-[var(--accent-emerald)]'
      }`}
    >
      {loading ? '…' : erro ? '⚠ erro' : gerado ? `✓ ingresso ${fmtDataHora(geradoEm!).split(',')[0]}` : curto ? '+ ingresso' : 'marcar gerado'}
    </button>
  )
}
