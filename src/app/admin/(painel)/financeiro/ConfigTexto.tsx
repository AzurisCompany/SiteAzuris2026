'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const campo =
  'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none placeholder:text-[var(--text-muted)]'

/** Editor inline de um parâmetro de texto (config da NF, cadastro de vendedoras). */
export default function ConfigTexto({
  chave,
  rotulo,
  valorAtual,
  placeholder,
  linhas,
}: {
  chave: 'nf_servico_descricao' | 'nf_municipal_service_code' | 'nf_municipal_service_name' | 'vendedoras'
  rotulo: string
  valorAtual: string
  placeholder?: string
  /** > 0 vira textarea (cadastro com uma linha por pessoa) */
  linhas?: number
}) {
  const router = useRouter()
  const [valor, setValor] = useState(valorAtual)
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  /** Tem texto digitado que ainda não foi gravado no banco. */
  const sujo = valor !== valorAtual

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
      <div className={linhas ? 'flex flex-col gap-2' : 'flex gap-2'}>
        {linhas ? (
          <textarea
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={placeholder}
            rows={linhas}
            className={`${campo} font-mono`}
          />
        ) : (
          <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder={placeholder} className={campo} />
        )}
        <button
          onClick={salvar}
          disabled={salvando}
          className={
            // Sujo = botão gritante. Digitar e sair da tela sem gravar já custou
            // duas vezes o "código não confere" na cara de uma vendedora.
            sujo
              ? `rounded-lg bg-[var(--azuris-cyan)] px-4 py-2.5 text-sm font-bold text-[var(--azuris-ink)] hover:brightness-110 disabled:opacity-60 ${
                  linhas ? 'self-start' : 'shrink-0'
                }`
              : `rounded-lg border border-[var(--azuris-cyan)]/40 bg-[var(--azuris-cyan)]/10 px-3 py-2 text-xs font-semibold text-[var(--azuris-cyan)] hover:bg-[var(--azuris-cyan)]/20 disabled:opacity-60 ${
                  linhas ? 'self-start' : 'shrink-0'
                }`
          }
        >
          {salvando ? 'salvando…' : ok ? 'salvo ✓' : sujo ? 'SALVAR alterações' : 'salvar'}
        </button>
      </div>
      {sujo && !salvando && (
        <p className="mt-1.5 text-xs font-semibold text-amber-300">
          ⚠ Alterado e ainda não salvo — sai desta tela agora e você perde o que digitou.
        </p>
      )}
      {erro && <p className="mt-1 text-xs text-red-300">{erro}</p>}
    </div>
  )
}
