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

const campo =
  'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none placeholder:text-[var(--text-muted)]'
const rotulo = 'block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1'

const CICLOS: Array<[string, string]> = [
  ['MONTHLY', 'Mensal'],
  ['QUARTERLY', 'Trimestral'],
  ['SEMIANNUALLY', 'Semestral'],
  ['YEARLY', 'Anual'],
  ['WEEKLY', 'Semanal'],
  ['BIWEEKLY', 'Quinzenal'],
]
const MEIOS: Array<[string, string]> = [
  ['PIX', 'PIX'],
  ['BOLETO', 'Boleto'],
  ['UNDEFINED', 'Cliente escolhe'],
]

export default function AssinaturaForm() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorRaw, setValorRaw] = useState('')
  const [cycle, setCycle] = useState('MONTHLY')
  const [billing, setBilling] = useState('PIX')
  const [isTeste, setIsTeste] = useState(false)

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const valorReais = useMemo(() => parseValor(valorRaw), [valorRaw])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setOk(false)
    setEnviando(true)
    try {
      const res = await fetch('/api/admin/assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'criar',
          nome,
          email,
          cpf_cnpj: cpf,
          telefone,
          descricao,
          valor_reais: valorReais,
          cycle,
          billing_type: billing,
          is_teste: isTeste,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data.error || 'Falha ao criar assinatura.')
        return
      }
      setOk(true)
      setNome('')
      setEmail('')
      setCpf('')
      setTelefone('')
      setDescricao('')
      setValorRaw('')
      setIsTeste(false)
      router.refresh()
      setTimeout(() => setOk(false), 2500)
    } catch {
      setErro('Erro de rede. Tenta de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="max-w-2xl space-y-5 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={rotulo}>Nome / razão social</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={3} className={campo} placeholder="Fulano de Tal" />
        </div>
        <div>
          <label className={rotulo}>E-mail</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" className={campo} placeholder="cliente@empresa.com" />
        </div>
        <div>
          <label className={rotulo}>CPF / CNPJ</label>
          <input value={cpf} onChange={(e) => setCpf(e.target.value)} required inputMode="numeric" className={campo} placeholder="só números" />
        </div>
        <div>
          <label className={rotulo}>Telefone (WhatsApp)</label>
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} inputMode="numeric" className={campo} placeholder="DDD + número" />
        </div>
      </div>

      <div>
        <label className={rotulo}>Descrição</label>
        <input value={descricao} onChange={(e) => setDescricao(e.target.value)} required minLength={3} className={campo} placeholder="Ex.: Mentoria mensal — plano Pro" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={rotulo}>Valor por ciclo (R$)</label>
          <input value={valorRaw} onChange={(e) => setValorRaw(e.target.value)} required inputMode="decimal" className={campo} placeholder="199,00" />
          {valorReais > 0 && <p className="mt-1 text-xs text-[var(--text-muted)]">= {brl(valorReais)}</p>}
        </div>
        <div>
          <label className={rotulo}>Frequência</label>
          <select value={cycle} onChange={(e) => setCycle(e.target.value)} className={campo}>
            {CICLOS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotulo}>Meio de pagamento</label>
          <select value={billing} onChange={(e) => setBilling(e.target.value)} className={campo}>
            {MEIOS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <input type="checkbox" checked={isTeste} onChange={(e) => setIsTeste(e.target.checked)} />
        marcar como teste (não conta nos KPIs)
      </label>

      {erro && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>}
      {ok && <div className="rounded-lg border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/10 px-4 py-3 text-sm text-[var(--accent-emerald)]">Assinatura criada ✓</div>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-[var(--azuris-cyan)] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
      >
        {enviando ? 'criando…' : 'Criar assinatura'}
      </button>
    </form>
  )
}
