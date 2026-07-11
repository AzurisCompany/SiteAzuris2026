'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { gaEvent } from '@/lib/gtag'
import { valorParcela, totalComJuros } from '@/lib/parcelamento'

/** Opção de tipo de ingresso já com disponibilidade resolvida no servidor. */
export interface TipoGuOption {
  tipo_id: string
  nome: string
  descricao: string | null
  gratuito: boolean
  precoPixReais: number
  precoCartaoBaseReais: number
  maxParcelas: number
  /** dd/mm da última data de venda, ou null */
  vendasAte: string | null
  disponivel: boolean
  motivo: 'encerrado' | 'esgotado' | null
}

type BillingType = 'PIX' | 'CREDIT_CARD'

const ASSOCIACOES = ['Associado IEP', 'Membro GU BigData & IA', 'Participante DSSBR'] as const

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

function maskCpfCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5')
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export default function InscricaoGuForm({ tipos, defaultTipo }: { tipos: TipoGuOption[]; defaultTipo?: string | null }) {
  // Pré-seleção vinda da página do evento (?tipo=...), senão o primeiro disponível.
  const inicial = useMemo(() => {
    const pre = tipos.findIndex((t) => t.tipo_id === defaultTipo && t.disponivel)
    if (pre >= 0) return pre
    return Math.max(0, tipos.findIndex((t) => t.disponivel))
  }, [tipos, defaultTipo])
  const [tipoIdx, setTipoIdx] = useState(inicial)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [associacao, setAssociacao] = useState<string>(ASSOCIACOES[0])
  const [billingType, setBillingType] = useState<BillingType>('PIX')
  const [installments, setInstallments] = useState(1)
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState<null | { duplicada: boolean }>(null)

  const sel = tipos[Math.min(tipoIdx, tipos.length - 1)]
  const gratuito = sel?.gratuito ?? false

  const parcelas = billingType === 'CREDIT_CARD' ? Math.min(installments, sel?.maxParcelas ?? 1) : 1
  const valorParcelaReais = valorParcela(sel?.precoCartaoBaseReais ?? 0, parcelas)
  const valorCobradoReais =
    billingType === 'PIX' ? (sel?.precoPixReais ?? 0) : totalComJuros(sel?.precoCartaoBaseReais ?? 0, parcelas)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/gubigdata/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          telefone: telefone.replace(/\D/g, ''),
          tipo: sel.tipo_id,
          consentimento: consent,
          ...(gratuito
            ? { como_conheceu: associacao }
            : {
                cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
                billing_type: billingType,
                installments: billingType === 'CREDIT_CARD' ? parcelas : 1,
              }),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErro(data?.error ?? 'Falha ao processar inscrição. Tenta de novo.')
        setSubmitting(false)
        return
      }

      if (data.gratuito) {
        setConfirmado({ duplicada: !!data.duplicada })
        setSubmitting(false)
        return
      }

      if (data.invoiceUrl) {
        gaEvent('begin_checkout', {
          currency: 'BRL',
          value: valorCobradoReais,
          payment_type: billingType,
          items: [
            {
              item_id: 'gubigdata-2026-07',
              item_name: 'Encontro Presencial GU BigData & IA — 30/07',
              item_variant: sel.tipo_id,
              price: valorCobradoReais,
              quantity: 1,
            },
          ],
        })
        window.location.href = data.invoiceUrl
      } else {
        setErro('Resposta inesperada do servidor.')
        setSubmitting(false)
      }
    } catch {
      setErro('Erro de rede. Tenta de novo.')
      setSubmitting(false)
    }
  }

  if (confirmado) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-[var(--accent-emerald)]" />
        <h2 className="mt-4 text-2xl font-bold">
          {confirmado.duplicada ? 'Você já está inscrito!' : 'Inscrição confirmada!'}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {confirmado.duplicada
            ? 'Já existe uma inscrição com esse e-mail pra esse evento — não precisa fazer de novo.'
            : 'Te esperamos dia 30/07 a partir das 18h30 no IEP (Rua Emiliano Perneta, 174 — Centro, Curitiba).'}
        </p>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Sua condição de associado/participante será conferida no credenciamento.
        </p>
      </div>
    )
  }

  const campo =
    'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--accent-emerald)] focus:outline-none'

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
      {/* Seleção de ingresso (estilo Sympla: linhas com preço e prazo) */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">Escolha uma opção</h2>
        {tipos.map((t, i) => {
          const ativo = i === Math.min(tipoIdx, tipos.length - 1) && t.disponivel
          return (
            <label
              key={t.tipo_id}
              className={`flex items-start justify-between gap-4 rounded-xl border-2 p-4 transition-all ${
                !t.disponivel
                  ? 'cursor-not-allowed border-[var(--azuris-surface)] bg-[var(--azuris-ink)] opacity-50'
                  : ativo
                    ? 'cursor-pointer border-[var(--accent-emerald)] bg-[var(--accent-emerald)]/5'
                    : 'cursor-pointer border-[var(--azuris-surface)] bg-[var(--azuris-ink)] hover:border-[var(--azuris-mist)]/50'
              }`}
            >
              <input
                type="radio"
                name="tipo"
                checked={ativo}
                disabled={!t.disponivel}
                onChange={() => setTipoIdx(i)}
                className="sr-only"
              />
              <div>
                <div className="font-bold">{t.nome}</div>
                {t.descricao && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{t.descricao}</div>}
                <div className="mt-1 text-xs text-[var(--text-muted)]">
                  {!t.disponivel
                    ? t.motivo === 'esgotado'
                      ? 'Esgotado'
                      : 'Vendas encerradas'
                    : t.vendasAte
                      ? `Vendas até ${t.vendasAte}`
                      : 'Vagas limitadas'}
                </div>
              </div>
              <div className="text-right">
                {t.gratuito ? (
                  <div className="text-xl font-black text-[var(--accent-emerald)]">Grátis</div>
                ) : (
                  <>
                    <div className="text-xl font-black">{brl(t.precoPixReais)}</div>
                    <div className="text-xs text-[var(--text-muted)]">PIX ou cartão em até {t.maxParcelas}x</div>
                  </>
                )}
              </div>
            </label>
          )
        })}
      </div>

      {/* Dados pessoais */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Seus dados</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Nome completo</label>
          <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className={campo} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" className={campo} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Telefone (WhatsApp)</label>
            <input
              type="tel"
              required
              minLength={14}
              value={telefone}
              onChange={(e) => setTelefone(maskPhone(e.target.value))}
              placeholder="(41) 99999-9999"
              className={campo}
            />
          </div>
        </div>

        {gratuito ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Sou associado/participante de</label>
            <select value={associacao} onChange={(e) => setAssociacao(e.target.value)} className={campo}>
              {ASSOCIACOES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--text-muted)]">A condição será conferida no credenciamento, na entrada do evento.</p>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">CPF ou CNPJ</label>
            <input
              type="text"
              required
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              className={campo}
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">Necessário pra emissão da cobrança.</p>
          </div>
        )}
      </div>

      {/* Forma de pagamento — só no ingresso pago */}
      {!gratuito && (
        <div className="space-y-4 pt-1">
          <h2 className="text-lg font-bold">Forma de pagamento</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                billingType === 'PIX'
                  ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald)]/5'
                  : 'border-[var(--azuris-surface)] bg-[var(--azuris-ink)] hover:border-[var(--azuris-mist)]/50'
              }`}
            >
              <input type="radio" name="billing" value="PIX" checked={billingType === 'PIX'} onChange={() => setBillingType('PIX')} className="sr-only" />
              <div className="font-bold">PIX</div>
              <div className="text-2xl font-black">{brl(sel.precoPixReais)}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">À vista, aprovação na hora</div>
            </label>
            <label
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                billingType === 'CREDIT_CARD'
                  ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald)]/5'
                  : 'border-[var(--azuris-surface)] bg-[var(--azuris-ink)] hover:border-[var(--azuris-mist)]/50'
              }`}
            >
              <input
                type="radio"
                name="billing"
                value="CREDIT_CARD"
                checked={billingType === 'CREDIT_CARD'}
                onChange={() => setBillingType('CREDIT_CARD')}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <span className="font-bold">Cartão</span>
                <span className="text-xs text-[var(--text-muted)]">em até {sel.maxParcelas}x</span>
              </div>
              <div className="text-2xl font-black">{brl(sel.precoCartaoBaseReais)}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">1x à vista · 2x a {sel.maxParcelas}x com juros do cartão</div>
            </label>
          </div>

          {billingType === 'CREDIT_CARD' && sel.maxParcelas > 1 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Parcelas</label>
              <select value={parcelas} onChange={(e) => setInstallments(Number(e.target.value))} className={campo}>
                {Array.from({ length: sel.maxParcelas }, (_, idx) => idx + 1).map((n) => {
                  const parcela = valorParcela(sel.precoCartaoBaseReais, n)
                  const total = totalComJuros(sel.precoCartaoBaseReais, n)
                  return (
                    <option key={n} value={n}>
                      {n}x de {brl(parcela)}
                      {n === 1 ? ' (à vista)' : ` — total ${brl(total)} com juros`}
                    </option>
                  )
                })}
              </select>
            </div>
          )}
        </div>
      )}

      <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent-emerald)]" />
        <span>
          Autorizo o uso dos meus dados pra credenciamento e comunicação sobre este evento (LGPD). Os dados não são
          compartilhados pra fins comerciais.
        </span>
      </label>

      {erro && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>}

      <button
        type="submit"
        disabled={submitting || !sel?.disponivel}
        className="w-full rounded-xl bg-[var(--accent-emerald)] px-6 py-4 text-base font-bold text-black shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
      >
        {submitting
          ? 'Processando…'
          : gratuito
            ? 'Confirmar inscrição gratuita'
            : billingType === 'PIX'
              ? `Gerar PIX de ${brl(valorCobradoReais)}`
              : parcelas > 1
                ? `Pagar ${parcelas}x de ${brl(valorParcelaReais)} no cartão`
                : `Pagar ${brl(sel.precoCartaoBaseReais)} no cartão`}
      </button>

      <p className="text-center text-xs text-[var(--text-muted)]">
        {gratuito ? 'Sem pagamento — sua vaga é confirmada na hora.' : 'Vai abrir o checkout seguro do Asaas pra você finalizar.'}
      </p>
    </form>
  )
}
