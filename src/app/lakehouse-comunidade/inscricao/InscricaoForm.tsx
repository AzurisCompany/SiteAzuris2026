'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { gaEvent } from '@/lib/gtag'
import { MAX_PARCELAS, valorParcela, totalComJuros } from '@/lib/parcelamento'
import CamposExtras, { extrasInicial, extrasParaPayload, type ExtrasValue } from '@/components/checkout/CamposExtras'

type Perfil = 'membro' | 'nao-membro'

interface PrecoPerfil {
  base: number
  pix: number
  vagas: number
}

interface Props {
  perfilInicial: Perfil
  precos: Record<Perfil, PrecoPerfil>
}

type BillingType = 'PIX' | 'CREDIT_CARD'

const PERFIL_LABEL: Record<Perfil, string> = {
  membro: 'Membro do GU BigData IA ou ex-participante do DSSBR',
  'nao-membro': 'Não sou membro',
}

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

export default function InscricaoForm({ perfilInicial, precos }: Props) {
  const [perfil, setPerfil] = useState<Perfil>(perfilInicial)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [billingType, setBillingType] = useState<BillingType>('PIX')
  const [installments, setInstallments] = useState(1)
  const [extras, setExtras] = useState<ExtrasValue>(extrasInicial)
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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

  const precoBaseReais = precos[perfil].base
  const precoPixReais = precos[perfil].pix
  const esgotado = precos[perfil].vagas <= 0

  // PIX é sempre à vista. Cartão: 1x sem juros; 2x–5x com juros embutidos.
  const parcelasCartao = billingType === 'CREDIT_CARD' ? installments : 1
  const valorParcelaReais = valorParcela(precoBaseReais, parcelasCartao)
  const valorCobradoReais =
    billingType === 'PIX'
      ? precoPixReais
      : totalComJuros(precoBaseReais, parcelasCartao)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
          telefone: telefone.replace(/\D/g, ''),
          perfil,
          billing_type: billingType,
          installments: billingType === 'CREDIT_CARD' ? installments : 1,
          utm,
          ...extrasParaPayload(extras),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErro(data?.error ?? 'Falha ao processar inscrição. Tenta de novo.')
        setSubmitting(false)
        return
      }

      // Redireciona pro checkout do Asaas
      if (data.invoiceUrl) {
        gaEvent('begin_checkout', {
          currency: 'BRL',
          value: valorCobradoReais,
          payment_type: billingType,
          items: [
            {
              item_id: 'lakehouse-pipeline',
              item_name: 'Lakehouse: Pipeline na Prática',
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
    } catch (e) {
      setErro('Erro de rede. Tenta de novo.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
      {/* Perfil / preço */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Seu perfil</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            O preço de R$ 550 é exclusivo para membros do GU BigData IA e ex-participantes do DSSBR. Não é membro? O investimento é R$ 750.
          </p>
        </div>

        <div className="grid gap-3">
          {(['membro', 'nao-membro'] as Perfil[]).map((p) => {
            const ativo = perfil === p
            return (
              <label
                key={p}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  ativo
                    ? 'border-[var(--azuris-cyan)] bg-[var(--azuris-cyan)]/5'
                    : 'border-[var(--azuris-surface)] bg-[var(--azuris-ink)] hover:border-[var(--azuris-mist)]/50'
                }`}
              >
                <input
                  type="radio"
                  name="perfil"
                  value={p}
                  checked={ativo}
                  onChange={() => setPerfil(p)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{PERFIL_LABEL[p]}</span>
                  <span className="text-xl font-black whitespace-nowrap">
                    R$ {precos[p].base.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {p === 'membro' && (
                  <div className="mt-1 text-xs text-[var(--accent-emerald)]">Preço de comunidade</div>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {esgotado ? (
        <div className="rounded-2xl border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/10 p-6 text-center">
          <p className="text-lg font-semibold">Vagas esgotadas neste perfil</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Escolha o outro perfil (se aplicável) ou mande um email pra{' '}
            <a href="mailto:binhara@azuris.com.br" className="underline">binhara@azuris.com.br</a>{' '}
            pra entrar na fila de espera.
          </p>
        </div>
      ) : (
        <>
      {/* Dados pessoais */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Seus dados</h2>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nome completo</label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--azuris-cyan)] focus:outline-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              className="w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--azuris-cyan)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Telefone (WhatsApp)</label>
            <input
              type="tel"
              required
              minLength={14}
              value={telefone}
              onChange={(e) => setTelefone(maskPhone(e.target.value))}
              placeholder="(41) 99999-9999"
              className="w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--azuris-cyan)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">CPF ou CNPJ</label>
          <input
            type="text"
            required
            value={cpfCnpj}
            onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            className="w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--azuris-cyan)] focus:outline-none"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">Necessário pra emissão da cobrança.</p>
        </div>
      </div>

      {/* Forma de pagamento */}
      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-bold">Forma de pagamento</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
            billingType === 'PIX'
              ? 'border-[var(--azuris-cyan)] bg-[var(--azuris-cyan)]/5'
              : 'border-[var(--azuris-surface)] bg-[var(--azuris-ink)] hover:border-[var(--azuris-mist)]/50'
          }`}>
            <input
              type="radio"
              name="billing"
              value="PIX"
              checked={billingType === 'PIX'}
              onChange={() => setBillingType('PIX')}
              className="sr-only"
            />
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">PIX</span>
              <span className="text-xs font-bold text-[var(--accent-emerald)]">-5%</span>
            </div>
            <div className="text-2xl font-black">R$ {precoPixReais.toFixed(2).replace('.', ',')}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">À vista, com 5% de desconto</div>
          </label>

          <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
            billingType === 'CREDIT_CARD'
              ? 'border-[var(--azuris-cyan)] bg-[var(--azuris-cyan)]/5'
              : 'border-[var(--azuris-surface)] bg-[var(--azuris-ink)] hover:border-[var(--azuris-mist)]/50'
          }`}>
            <input
              type="radio"
              name="billing"
              value="CREDIT_CARD"
              checked={billingType === 'CREDIT_CARD'}
              onChange={() => setBillingType('CREDIT_CARD')}
              className="sr-only"
            />
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">Cartão</span>
              <span className="text-xs text-[var(--text-muted)]">em até {MAX_PARCELAS}x</span>
            </div>
            <div className="text-2xl font-black">R$ {precoBaseReais.toFixed(2).replace('.', ',')}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              1x à vista · 2x a {MAX_PARCELAS}x com juros do cartão
            </div>
          </label>
        </div>

        {billingType === 'CREDIT_CARD' && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Parcelas</label>
            <select
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2.5 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none"
            >
              {Array.from({ length: MAX_PARCELAS }, (_, idx) => idx + 1).map((n) => {
                const parcela = valorParcela(precoBaseReais, n)
                const total = totalComJuros(precoBaseReais, n)
                return (
                  <option key={n} value={n}>
                    {n}x de R$ {parcela.toFixed(2).replace('.', ',')}
                    {n === 1
                      ? ' (à vista)'
                      : ` — total R$ ${total.toFixed(2).replace('.', ',')} com juros`}
                  </option>
                )
              })}
            </select>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              1x à vista sem juros. De 2x a {MAX_PARCELAS}x os juros do cartão são por sua conta.
            </p>
          </div>
        )}
      </div>

      <CamposExtras value={extras} onChange={setExtras} />

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-to-r from-[var(--azuris-cyan)] to-[var(--accent-violet)] px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
      >
        {submitting
          ? 'Processando…'
          : billingType === 'PIX'
            ? `Gerar PIX de R$ ${valorCobradoReais.toFixed(2).replace('.', ',')}`
            : installments > 1
              ? `Pagar ${installments}x de R$ ${valorParcelaReais.toFixed(2).replace('.', ',')} no cartão`
              : `Pagar R$ ${precoBaseReais.toFixed(2).replace('.', ',')} no cartão`}
      </button>

      <p className="text-center text-xs text-[var(--text-muted)]">
        Vai abrir o checkout seguro do Asaas pra você finalizar.
      </p>
        </>
      )}
    </form>
  )
}
