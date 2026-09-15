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

/** Marca/desmarca a nota fiscal da venda como emitida. Reusado na lista e no detalhe. */
export default function NotaEmitidaButton({ id, emitidaEm }: { id: number; emitidaEm: string | null | undefined }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const emitida = Boolean(emitidaEm)

  async function alternar() {
    if (emitida && !confirm('Desmarcar a nota fiscal como emitida? A data da marcação se perde.')) return
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch('/api/admin/inscricoes/nota-emitida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, emitida: !emitida }),
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
        (emitida ? `NF marcada como emitida em ${fmtDataHora(emitidaEm!)} — clique pra desmarcar` : 'Marcar a nota fiscal como emitida')
      }
      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
        erro
          ? 'border-red-500/40 bg-red-500/10 text-red-300'
          : emitida
            ? 'border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)]/20'
            : 'border-amber-400/40 text-amber-300 hover:bg-amber-400/10'
      }`}
    >
      {loading ? '…' : erro ? '⚠ erro' : emitida ? `✓ NF ${fmtDataHora(emitidaEm!).split(',')[0]}` : 'marcar NF emitida'}
    </button>
  )
}
