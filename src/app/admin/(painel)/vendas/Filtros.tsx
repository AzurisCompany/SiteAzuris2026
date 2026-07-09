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
  ['', 'Todos os meios'],
  ['PIX', 'PIX'],
  ['CREDIT_CARD', 'Cartão'],
  ['BOLETO', 'Boleto'],
  ['UNDEFINED', 'Cliente escolhe'],
]
const PESSOA: ReadonlyArray<readonly [string, string]> = [
  ['', 'PF e PJ'],
  ['PF', 'Pessoa física'],
  ['PJ', 'Pessoa jurídica'],
]

const campo =
  'rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none'

interface FiltrosState {
  status?: string
  billing?: string
  tipo?: string
  pessoa?: string
  origem?: string
  de?: string
  ate?: string
  busca?: string
}

export default function Filtros({
  curso,
  status,
  billing,
  tipo,
  pessoa,
  origem,
  de,
  ate,
  busca,
  tipos,
  origens,
}: {
  curso: string
  status: string
  billing: string
  tipo: string
  pessoa: string
  origem: string
  de: string
  ate: string
  busca: string
  tipos: string[]
  origens: string[]
}) {
  const router = useRouter()
  const [q, setQ] = useState(busca)
  const montou = useRef(false)

  function aplicar(next: FiltrosState) {
    const u = new URLSearchParams()
    if (curso) u.set('curso', curso)
    const set = (key: keyof FiltrosState, atual: string) => {
      const v = (next[key] ?? atual).trim()
      if (v) u.set(key, v)
    }
    set('status', status)
    set('billing', billing)
    set('tipo', tipo)
    set('pessoa', pessoa)
    set('origem', origem)
    set('de', de)
    set('ate', ate)
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
    <div className="space-y-3 rounded-xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tipos.length > 0 && (
            <select value={tipo} onChange={(e) => aplicar({ tipo: e.target.value })} className={campo}>
              <option value="">Todos os tipos</option>
              {tipos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          <select value={pessoa} onChange={(e) => aplicar({ pessoa: e.target.value })} className={campo}>
            {PESSOA.map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
          {origens.length > 0 && (
            <select value={origem} onChange={(e) => aplicar({ origem: e.target.value })} className={campo}>
              <option value="">Todas as origens</option>
              {origens.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-muted)]">de</label>
            <input type="date" value={de} onChange={(e) => aplicar({ de: e.target.value })} className={`${campo} flex-1`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-muted)]">até</label>
            <input type="date" value={ate} onChange={(e) => aplicar({ ate: e.target.value })} className={`${campo} flex-1`} />
          </div>
      </div>
    </div>
  )
}
