'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Encerra uma cobrança pendente/vencida: apaga no Asaas e marca 'cancelled' aqui.
 * Reusado na lista (variante compacta) e no detalhe da venda (variante bloco).
 * Ação destrutiva — sempre passa por confirm com o nome do cliente.
 */
export default function CancelarButton({
  id,
  nome,
  variante = 'linha',
}: {
  id: number
  nome: string
  variante?: 'linha' | 'bloco'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function cancelar() {
    setErro(null)
    if (
      !window.confirm(
        `Cancelar a cobrança de ${nome}?\n\n` +
          `A cobrança some do Asaas (o cliente não consegue mais pagar pelo link) e a venda ` +
          `fica com status Cancelado aqui. Não dá pra desfazer — pra voltar atrás você gera ` +
          `uma cobrança nova.`
      )
    )
      return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/cobranca/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data.error || 'Falha ao cancelar.')
        return
      }
      router.refresh()
    } catch {
      setErro('Erro de rede. Tenta de novo.')
    } finally {
      setLoading(false)
    }
  }

  if (variante === 'linha') {
    return (
      <>
        <button
          onClick={cancelar}
          disabled={loading}
          title="Cancelar a cobrança no Asaas e encerrar a venda"
          className="rounded-lg border border-[var(--azuris-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-red-400/40 hover:text-red-300 disabled:opacity-60"
        >
          {loading ? '…' : 'cancelar'}
        </button>
        {erro && <div className="mt-1 text-xs text-red-300">{erro}</div>}
      </>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-muted)]">
        Apaga a cobrança no Asaas (o link de pagamento morre) e marca a venda como Cancelada. A linha continua no
        painel como histórico. Pra retomar depois, gere uma cobrança nova pela Cobrança avulsa.
      </p>
      {erro && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}
      <button
        onClick={cancelar}
        disabled={loading}
        className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      >
        {loading ? 'cancelando…' : 'Cancelar cobrança'}
      </button>
    </div>
  )
}
