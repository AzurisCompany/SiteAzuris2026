'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { gaEvent } from '@/lib/gtag'
import { valorParcela, totalComJuros } from '@/lib/parcelamento'
import CamposExtras, { extrasInicial, extrasParaPayload, type ExtrasValue } from '@/components/checkout/CamposExtras'
import CampoDocumento, { type PessoaTipo } from '@/components/checkout/CampoDocumento'

/** Default: espelha PRODUTOS['dss-2026'].enderecoObrigatorioPJ — ingresso corporativo vira nota.
 *  Produtos de pessoa física (ex.: adesão do ETT) passam `enderecoObrigatorioPJ={false}`. */
const ENDERECO_OBRIGATORIO_PJ_PADRAO = true

/** Opção de tipo de ingresso vinda do catálogo (admin). */
export interface TipoOption {
  tipo_id: string
  nome: string
  descricao: string | null
  precoPixReais: number
  precoCartaoBaseReais: number
  precoDeVendaReais: number
  maxParcelas: number
}

interface Props {
  /** preço cheio de venda (lote final / no dia) — âncora "de" riscada (ex.: R$ 820) */
  precoDeVendaReais: number
  /** preço no PIX à vista (ex.: R$ 470) */
  precoPixReais: number
  /** preço-base do cartão à vista; 2x+ com juros sobre essa base (ex.: R$ 470) */
  precoCartaoBaseReais: number
  maxParcelas: number
  /** tipos de ingresso cadastrados; se não-vazio, mostra o seletor e ignora os preços únicos acima */
  tipos?: TipoOption[]
  /** token do link de vendedora ([[cupom]]) — vai junto no POST pro servidor revalidar */
  cupom?: string
  /** código fixo do cupom de parceiro (?c=) — idem, revalidado no servidor */
  cupomCodigo?: string
  /** endpoint do POST de inscrição (default: checkout DSS full). */
  endpoint?: string
  /** identificação do item pro GA begin_checkout (default: DSS full). */
  gaItem?: { id: string; name: string }
  /** PJ só fecha com endereço completo (default: true, como no DSS). Espelha o registry. */
  enderecoObrigatorioPJ?: boolean
}

type BillingType = 'PIX' | 'CREDIT_CARD'

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export default function InscricaoForm({
  precoDeVendaReais: baseDeVenda,
  precoPixReais: basePix,
  precoCartaoBaseReais: baseCartao,
  maxParcelas: baseMax,
  tipos,
  cupom,
  cupomCodigo,
  endpoint = '/api/dssbr-2026/inscricao',
  gaItem = { id: 'dss-2026', name: 'Data Science Summit Brasil 2026' },
  enderecoObrigatorioPJ = ENDERECO_OBRIGATORIO_PJ_PADRAO,
}: Props) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [pessoaTipo, setPessoaTipo] = useState<PessoaTipo>('PF')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [billingType, setBillingType] = useState<BillingType>('PIX')
  const [installments, setInstallments] = useState(1)
  const [tipoIdx, setTipoIdx] = useState(0)
  const [extras, setExtras] = useState<ExtrasValue>(extrasInicial)
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [utm, setUtm] = useState<{ source?: string; medium?: string; campaign?: string; content?: string; term?: string }>({})

  // Preços efetivos: do tipo selecionado (se houver catálogo) ou o preço único.
  const temTipos = !!tipos && tipos.length > 0
  const sel = temTipos ? tipos![Math.min(tipoIdx, tipos!.length - 1)] : null
  const precoDeVendaReais = sel ? sel.precoDeVendaReais : baseDeVenda
  const precoPixReais = sel ? sel.precoPixReais : basePix
  const precoCartaoBaseReais = sel ? sel.precoCartaoBaseReais : baseCartao
  const maxParcelas = sel ? sel.maxParcelas : baseMax

  // Se trocar de tipo pra um com menos parcelas, corrige a seleção.
  useEffect(() => {
    if (installments > maxParcelas) setInstallments(maxParcelas)
  }, [maxParcelas, installments])

  // Ambos os pagamentos partem do preço do lote vigente; mostramos o preço cheio
  // de venda riscado como âncora (o que vai custar no lote final).
  const temAncora = precoDeVendaReais > precoPixReais
  const descontoPct = temAncora ? Math.round((1 - precoPixReais / precoDeVendaReais) * 100) : 0

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

  // PIX é sempre à vista (com desconto). Cartão: base com acréscimo; 1x sem juros, 2x+ com juros.
  const parcelasCartao = billingType === 'CREDIT_CARD' ? installments : 1
  const valorParcelaReais = valorParcela(precoCartaoBaseReais, parcelasCartao)
  const valorCobradoReais =
    billingType === 'PIX'
      ? precoPixReais
      : totalComJuros(precoCartaoBaseReais, parcelasCartao)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setSubmitting(true)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
          telefone: telefone.replace(/\D/g, ''),
          tipo: sel?.tipo_id,
          cupom,
          cupom_codigo: cupomCodigo,
          billing_type: billingType,
          installments: billingType === 'CREDIT_CARD' ? installments : 1,
          utm,
          ...extrasParaPayload(extras, pessoaTipo, enderecoObrigatorioPJ),
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
              item_id: gaItem.id,
              item_name: gaItem.name,
              item_variant: sel?.tipo_id,
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

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
      {/* Tipo de ingresso (só quando há catálogo cadastrado) */}
      {temTipos && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Tipo de ingresso</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {tipos!.map((t, i) => {
              const ativo = i === Math.min(tipoIdx, tipos!.length - 1)
              const temAnc = t.precoDeVendaReais > t.precoPixReais
              return (
                <label
                  key={t.tipo_id}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    ativo
                      ? 'border-[var(--azuris-cyan)] bg-[var(--azuris-cyan)]/5'
                      : 'border-[var(--azuris-surface)] bg-[var(--azuris-ink)] hover:border-[var(--azuris-mist)]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    checked={ativo}
                    onChange={() => setTipoIdx(i)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{t.nome}</span>
                    {temAnc && (
                      <span className="text-xs font-bold text-[var(--accent-emerald)]">
                        -{Math.round((1 - t.precoPixReais / t.precoDeVendaReais) * 100)}%
                      </span>
                    )}
                  </div>
                  {t.descricao && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{t.descricao}</div>}
                  {temAnc && (
                    <div className="mt-1 text-xs text-[var(--text-muted)] line-through">
                      R$ {t.precoDeVendaReais.toFixed(2).replace('.', ',')}
                    </div>
                  )}
                  <div className="text-2xl font-black">R$ {t.precoPixReais.toFixed(2).replace('.', ',')}</div>
                  <div className="mt-0.5 text-xs text-[var(--text-muted)]">no PIX · cartão até {t.maxParcelas}x</div>
                </label>
              )
            })}
          </div>
        </div>
      )}

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

        <CampoDocumento
          pessoaTipo={pessoaTipo}
          onPessoaTipoChange={setPessoaTipo}
          valor={cpfCnpj}
          onChange={setCpfCnpj}
          ajuda="Necessário pra emissão da cobrança."
        />
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
              {temAncora && (
                <span className="text-xs font-bold text-[var(--accent-emerald)]">
                  -{descontoPct}%
                </span>
              )}
            </div>
            {temAncora && (
              <div className="text-xs text-[var(--text-muted)] line-through">R$ {precoDeVendaReais.toFixed(2).replace('.', ',')}</div>
            )}
            <div className="text-2xl font-black">R$ {precoPixReais.toFixed(2).replace('.', ',')}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              À vista, aprovação na hora
            </div>
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
              <span className="text-xs text-[var(--text-muted)]">em até {maxParcelas}x</span>
            </div>
            {temAncora && (
              <div className="text-xs text-[var(--text-muted)] line-through">R$ {precoDeVendaReais.toFixed(2).replace('.', ',')}</div>
            )}
            <div className="text-2xl font-black">R$ {precoCartaoBaseReais.toFixed(2).replace('.', ',')}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              1x à vista · 2x a {maxParcelas}x com juros do cartão
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
              {Array.from({ length: maxParcelas }, (_, idx) => idx + 1).map((n) => {
                const parcela = valorParcela(precoCartaoBaseReais, n)
                const total = totalComJuros(precoCartaoBaseReais, n)
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
              1x à vista sem juros. De 2x a {maxParcelas}x os juros do cartão são por sua conta.
            </p>
          </div>
        )}
      </div>

      <CamposExtras
        value={extras}
        onChange={setExtras}
        pessoaTipo={pessoaTipo}
        enderecoObrigatorioPJ={enderecoObrigatorioPJ}
      />

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
              : `Pagar R$ ${precoCartaoBaseReais.toFixed(2).replace('.', ',')} no cartão`}
      </button>

      <p className="text-center text-xs text-[var(--text-muted)]">
        Vai abrir o checkout seguro do Asaas pra você finalizar.
      </p>
    </form>
  )
}
