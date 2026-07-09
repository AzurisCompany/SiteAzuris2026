'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function parseValor(raw: string): number {
  let s = raw.replace(/[^\d.,]/g, '')
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (s.includes(',')) s = s.replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}
function onlyDigits(s: string): string {
  return s.replace(/\D/g, '')
}

const campo =
  'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none'
const rotulo = 'block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1'

interface Props {
  id: number
  invoiceUrl: string
  telefone: string | null
  nome: string
  descricao: string
  valorReais: number
  dueDate: string | null
  installments: number
}

export default function AcoesCobranca({ id, invoiceUrl, telefone, nome, descricao, valorReais, dueDate, installments }: Props) {
  const router = useRouter()
  const hoje = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const parcelada = installments > 1

  const [venc, setVenc] = useState(dueDate ?? hoje)
  const [valorRaw, setValorRaw] = useState(valorReais.toFixed(2).replace('.', ','))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [copiado, setCopiado] = useState<'link' | 'msg' | null>(null)

  const novoValor = useMemo(() => parseValor(valorRaw), [valorRaw])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setOk(false)
    setSalvando(true)
    try {
      const payload: { id: number; due_date?: string; valor_reais?: number } = { id }
      if (venc && venc !== dueDate) payload.due_date = venc
      if (!parcelada && Math.round(novoValor * 100) !== Math.round(valorReais * 100)) payload.valor_reais = novoValor
      if (payload.due_date == null && payload.valor_reais == null) {
        setErro('Nada mudou.')
        return
      }
      const res = await fetch('/api/admin/cobranca/atualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data.error || 'Falha ao atualizar.')
        return
      }
      setOk(true)
      router.refresh()
    } catch {
      setErro('Erro de rede. Tenta de novo.')
    } finally {
      setSalvando(false)
    }
  }

  const mensagem = useMemo(() => {
    const primeiroNome = nome.trim().split(/\s+/)[0] || ''
    const vencBR = venc ? new Date(`${venc}T00:00:00`).toLocaleDateString('pt-BR') : ''
    return (
      `Olá${primeiroNome ? ', ' + primeiroNome : ''}! Segue o link pra pagamento — ${descricao}.\n` +
      `Valor: ${brl(valorReais)}${vencBR ? ` · vencimento ${vencBR}` : ''}.\n\n` +
      `${invoiceUrl}\n\nQualquer dúvida, é só chamar. — Azuris`
    )
  }, [nome, descricao, valorReais, venc, invoiceUrl])

  const waUrl = useMemo(() => {
    const d = onlyDigits(telefone ?? '')
    if (d.length !== 10 && d.length !== 11) return null
    return `https://wa.me/55${d}?text=${encodeURIComponent(mensagem)}`
  }, [telefone, mensagem])

  async function copiar(texto: string, qual: 'link' | 'msg') {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(qual)
      setTimeout(() => setCopiado(null), 1800)
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <div className="space-y-5">
      {/* Editar */}
      <form onSubmit={salvar} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={rotulo}>Novo vencimento</label>
            <input type="date" min={hoje} value={venc} onChange={(e) => setVenc(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Novo valor (R$)</label>
            <input
              value={valorRaw}
              onChange={(e) => setValorRaw(e.target.value)}
              disabled={parcelada}
              inputMode="decimal"
              className={`${campo} disabled:opacity-50`}
            />
            {parcelada && <p className="mt-1 text-xs text-[var(--text-muted)]">Parcelada ({installments}x) — valor não editável.</p>}
          </div>
        </div>
        {erro && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}
        {ok && <div className="rounded-lg border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/10 px-3 py-2 text-sm text-[var(--accent-emerald)]">Cobrança atualizada ✓</div>}
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-[var(--azuris-cyan)] px-4 py-2 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
        >
          {salvando ? 'salvando…' : 'Salvar alterações'}
        </button>
      </form>

      {/* Reenviar */}
      <div className="border-t border-[var(--azuris-surface)] pt-4">
        <span className={rotulo}>Reenviar link de pagamento</span>
        <div className="flex flex-wrap gap-2">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-emerald)] px-4 py-2 text-sm font-bold text-black hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              WhatsApp do cliente
            </a>
          )}
          <button
            type="button"
            onClick={() => copiar(mensagem, 'msg')}
            className="rounded-lg border border-[var(--azuris-surface)] px-4 py-2 text-sm font-semibold hover:border-[var(--azuris-cyan)]/40"
          >
            {copiado === 'msg' ? 'mensagem copiada ✓' : 'copiar mensagem'}
          </button>
          <button
            type="button"
            onClick={() => copiar(invoiceUrl, 'link')}
            className="rounded-lg border border-[var(--azuris-surface)] px-4 py-2 text-sm font-semibold hover:border-[var(--azuris-cyan)]/40"
          >
            {copiado === 'link' ? 'copiado ✓' : 'copiar link'}
          </button>
        </div>
        {!waUrl && <p className="mt-2 text-xs text-amber-300">Telefone sem WhatsApp válido — use copiar link/mensagem.</p>}
      </div>
    </div>
  )
}
