'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Opções inline (não importa de admin-queries — que puxa código de servidor).
const STATUS: ReadonlyArray<readonly [string, string]> = [
  ['', 'Todos os status'],
  ['paid', 'Pago'],
  ['pending', 'Pendente'],
  ['overdue', 'Vencido'],
  ['cancelled', 'Cancelado'],
  ['refunded', 'Estornado'],
]
const BILLING: ReadonlyArray<readonly [string, string]> = [
  ['', 'PIX e cartão'],
  ['PIX', 'PIX'],
  ['CREDIT_CARD', 'Cartão'],
]

const campo =
  'rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none'

export default function Filtros({
  curso,
  status,
  billing,
  busca,
}: {
  curso: string
  status: string
  billing: string
  busca: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(busca)
  const montou = useRef(false)

  function aplicar(next: { status?: string; billing?: string; busca?: string }) {
    const u = new URLSearchParams()
    if (curso) u.set('curso', curso)
    const s = next.status ?? status
    if (s) u.set('status', s)
    const b = next.billing ?? billing
    if (b) u.set('billing', b)
    const bu = (next.busca ?? q).trim()
    if (bu) u.set('busca', bu)
    const str = u.toString()
    router.replace(str ? `/admin/vendas?${str}` : '/admin/vendas')
  }

  // Busca com debounce (não dispara no primeiro render).
  useEffect(() => {
    if (!montou.current) {
      montou.current = true
      return
    }
    const t = setTimeout(() => aplicar({ busca: q }), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 rounded-xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-4">
      <select value={status} onChange={(e) => aplicar({ status: e.target.value })} className={campo}>
        {STATUS.map(([v, label]) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
      <select value={billing} onChange={(e) => aplicar({ billing: e.target.value })} className={campo}>
        {BILLING.map(([v, label]) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="nome, email ou CPF"
        className={`${campo} placeholder:text-[var(--text-muted)]`}
      />
    </div>
  )
}
