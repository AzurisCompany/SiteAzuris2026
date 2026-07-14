'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { gaEvent } from '@/lib/gtag'
import { maskPhone } from '@/lib/format'

const CAMPO =
  'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--azuris-cyan)] focus:outline-none'

export default function ReservaForm() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState<null | { duplicada: boolean }>(null)
  const [utm, setUtm] = useState<{ source?: string; medium?: string; campaign?: string; content?: string; term?: string }>({})

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUtm({
      source: params.get('utm_source') ?? undefined,
      medium: params.get('utm_medium') ?? undefined,
      campaign: params.get('utm_campaign') ?? undefined,
      content: params.get('utm_content') ?? undefined,
      term: params.get('utm_term') ?? undefined,
    })
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/preparatorio-dados/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          telefone,
          tipo: 'reserva',
          consentimento: consent,
          utm,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErro(data?.error ?? 'Falha ao registrar a reserva. Tenta de novo.')
        setSubmitting(false)
        return
      }

      if (data.gratuito) {
        if (!data.duplicada) {
          gaEvent('generate_lead', { currency: 'BRL', value: 0, items: [{ item_id: 'preparatorio-dados', item_name: 'Curso Preparatório de Dados — reserva', quantity: 1 }] })
        }
        setConfirmado({ duplicada: !!data.duplicada })
      } else {
        setErro('Resposta inesperada do servidor.')
      }
      setSubmitting(false)
    } catch {
      setErro('Erro de rede. Tenta de novo.')
      setSubmitting(false)
    }
  }

  if (confirmado) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--accent-emerald)] bg-[var(--azuris-deep)] p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-[var(--accent-emerald)]" />
        <h2 className="mt-4 text-2xl font-bold">
          {confirmado.duplicada ? 'Você já está na lista!' : 'Reserva registrada!'}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {confirmado.duplicada
            ? 'Esse e-mail já estava reservado — não precisa fazer de novo. Seu lugar na fila e o desconto de fundador continuam valendo.'
            : 'Pronto. Quando o preparatório abrir, você recebe o aviso por e-mail antes de todo mundo, com o desconto de fundador.'}
        </p>
        <p className="mt-3 text-xs text-[var(--text-muted)]">Nada foi cobrado — reservar não é comprar.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
      <h2 className="text-lg font-bold">Seus dados</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Nome</label>
        <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className={CAMPO} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@empresa.com"
          className={CAMPO}
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">É por aqui que o aviso de abertura chega.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">WhatsApp</label>
        <input
          type="tel"
          required
          inputMode="numeric"
          value={telefone}
          onChange={(e) => setTelefone(maskPhone(e.target.value))}
          placeholder="(41) 99999-9999"
          className={CAMPO}
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Pra gente conversar e entender o que você já sabe — o preparatório está sendo montado em cima disso.
        </p>
      </div>

      <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--azuris-cyan)]"
        />
        <span>
          Autorizo a Azuris a usar meu e-mail e meu WhatsApp pra falar comigo sobre o curso preparatório (LGPD). Sem
          repasse pra terceiros.
        </span>
      </label>

      {erro && <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-to-r from-[var(--azuris-cyan)] to-[var(--accent-violet)] px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
      >
        {submitting ? 'Registrando…' : 'Reservar minha vaga (grátis)'}
      </button>

      <p className="text-center text-xs text-[var(--text-muted)]">
        Sem pagamento, sem cartão, sem compromisso.
      </p>
    </form>
  )
}
