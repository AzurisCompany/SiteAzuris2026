'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_COR: Record<string, string> = {
  AUTHORIZED: 'text-[var(--accent-emerald)] bg-[var(--accent-emerald)]/12',
  SCHEDULED: 'text-amber-300 bg-amber-300/12',
  SYNCHRONIZED: 'text-amber-300 bg-amber-300/12',
  PROCESSING_CANCELLATION: 'text-orange-400 bg-orange-400/12',
  CANCELED: 'text-[var(--text-muted)] bg-[var(--text-muted)]/12',
  CANCELLATION_DENIED: 'text-red-300 bg-red-300/12',
  ERROR: 'text-red-300 bg-red-300/12',
}
const STATUS_LABEL: Record<string, string> = {
  AUTHORIZED: 'Autorizada',
  SCHEDULED: 'Agendada',
  SYNCHRONIZED: 'Sincronizada',
  PROCESSING_CANCELLATION: 'Cancelando',
  CANCELED: 'Cancelada',
  CANCELLATION_DENIED: 'Cancel. negada',
  ERROR: 'Erro',
}

interface Props {
  id: number
  nfId: string | null
  nfStatus: string | null
  nfNumero: string | null
  nfPdfUrl: string | null
  nfXmlUrl: string | null
}

export default function NotaFiscal({ id, nfId, nfStatus, nfNumero, nfPdfUrl, nfXmlUrl }: Props) {
  const router = useRouter()
  const [carregando, setCarregando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function acao(action: 'emitir' | 'sincronizar' | 'cancelar') {
    if (action === 'cancelar' && !confirm('Cancelar esta nota fiscal no Asaas?')) return
    setCarregando(action)
    setErro(null)
    try {
      const res = await fetch('/api/admin/nf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data.error || 'Falha na operação.')
        return
      }
      router.refresh()
    } catch {
      setErro('Erro de rede.')
    } finally {
      setCarregando(null)
    }
  }

  const btn =
    'rounded-lg border border-[var(--azuris-surface)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--azuris-cyan)]/40 disabled:opacity-60'

  return (
    <div className="space-y-3">
      {nfId ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COR[nfStatus ?? ''] ?? ''}`}>
              {STATUS_LABEL[nfStatus ?? ''] ?? nfStatus ?? '—'}
            </span>
            {nfNumero && <span className="text-[var(--text-secondary)]">nº {nfNumero}</span>}
            {nfPdfUrl && (
              <a href={nfPdfUrl} target="_blank" rel="noreferrer" className="text-[var(--azuris-cyan)] hover:underline">
                PDF ↗
              </a>
            )}
            {nfXmlUrl && (
              <a href={nfXmlUrl} target="_blank" rel="noreferrer" className="text-[var(--azuris-cyan)] hover:underline">
                XML ↗
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => acao('sincronizar')} disabled={!!carregando} className={btn}>
              {carregando === 'sincronizar' ? '…' : '↻ sincronizar'}
            </button>
            {nfStatus !== 'CANCELED' && (
              <button
                onClick={() => acao('cancelar')}
                disabled={!!carregando}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
              >
                {carregando === 'cancelar' ? '…' : 'cancelar NF'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => acao('emitir')}
            disabled={!!carregando}
            className="rounded-lg bg-[var(--azuris-cyan)] px-4 py-1.5 text-xs font-bold text-black hover:opacity-90 disabled:opacity-50"
          >
            {carregando === 'emitir' ? 'emitindo…' : 'Emitir NF'}
          </button>
          <button onClick={() => acao('sincronizar')} disabled={!!carregando} className={btn}>
            {carregando === 'sincronizar' ? '…' : 'buscar NF existente'}
          </button>
          <span className="text-xs text-[var(--text-muted)]">emite a NFS-e pelo Asaas</span>
        </div>
      )}
      {erro && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}
    </div>
  )
}
