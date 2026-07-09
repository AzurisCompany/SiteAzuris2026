'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function parseNum(raw: string): number {
  let s = raw.replace(/[^\d.,]/g, '')
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (s.includes(',')) s = s.replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

const campo =
  'w-32 rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-1.5 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none'

/** Editor inline de um parâmetro financeiro. `unidade` decide a conversão. */
export default function ConfigNumero({
  chave,
  rotulo,
  unidade,
  valorAtual,
  dica,
}: {
  chave: 'meta_mensal_centavos' | 'aliquota_imposto_pct'
  rotulo: string
  unidade: 'reais' | 'pct'
  valorAtual: number // canônico: centavos (reais) ou pct
  dica?: string
}) {
  const router = useRouter()
  const inicial = unidade === 'reais' ? (valorAtual / 100).toFixed(2).replace('.', ',') : String(valorAtual)
  const [raw, setRaw] = useState(inicial)
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    setSalvando(true)
    setOk(false)
    setErro(null)
    try {
      const n = parseNum(raw)
      const valor = unidade === 'reais' ? Math.round(n * 100) : n
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave, valor }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data.error || 'Falha ao salvar.')
        return
      }
      setOk(true)
      router.refresh()
      setTimeout(() => setOk(false), 1800)
    } catch {
      setErro('Erro de rede.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{rotulo}</label>
      <div className="flex items-center gap-1">
        {unidade === 'reais' && <span className="text-sm text-[var(--text-muted)]">R$</span>}
        <input value={raw} onChange={(e) => setRaw(e.target.value)} inputMode="decimal" className={campo} />
        {unidade === 'pct' && <span className="text-sm text-[var(--text-muted)]">%</span>}
      </div>
      <button
        onClick={salvar}
        disabled={salvando}
        className="rounded-lg border border-[var(--azuris-cyan)]/40 bg-[var(--azuris-cyan)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--azuris-cyan)] hover:bg-[var(--azuris-cyan)]/20 disabled:opacity-60"
      >
        {salvando ? '…' : ok ? 'salvo ✓' : 'salvar'}
      </button>
      {erro && <span className="text-xs text-red-300">{erro}</span>}
      {dica && !erro && <span className="text-xs text-[var(--text-muted)]">{dica}</span>}
    </div>
  )
}
