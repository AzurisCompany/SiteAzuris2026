'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const campo =
  'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none placeholder:text-[var(--text-muted)]'

/** Editor inline de um parâmetro de texto (config da NF). */
export default function ConfigTexto({
  chave,
  rotulo,
  valorAtual,
  placeholder,
}: {
  chave: 'nf_servico_descricao' | 'nf_municipal_service_code' | 'nf_municipal_service_name'
  rotulo: string
  valorAtual: string
  placeholder?: string
}) {
  const router = useRouter()
  const [valor, setValor] = useState(valorAtual)
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    setSalvando(true)
    setOk(false)
    setErro(null)
    try {
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
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{rotulo}</label>
      <div className="flex gap-2">
        <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder={placeholder} className={campo} />
        <button
          onClick={salvar}
          disabled={salvando}
          className="shrink-0 rounded-lg border border-[var(--azuris-cyan)]/40 bg-[var(--azuris-cyan)]/10 px-3 py-2 text-xs font-semibold text-[var(--azuris-cyan)] hover:bg-[var(--azuris-cyan)]/20 disabled:opacity-60"
        >
          {salvando ? '…' : ok ? 'salvo ✓' : 'salvar'}
        </button>
      </div>
      {erro && <p className="mt-1 text-xs text-red-300">{erro}</p>}
    </div>
  )
}
