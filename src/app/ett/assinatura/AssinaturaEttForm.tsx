'use client'

// Form da assinatura do ETT (Trilha de Dedicação). Diferente dos outros checkouts
// do site, aqui não se escolhe forma de pagamento: a subscription vai como
// UNDEFINED e o cliente decide PIX, boleto ou cartão na fatura do Asaas — no
// cartão a renovação é automática. Ver [[ett]] e /api/ett/assinatura.
//
// Sem campos de nota fiscal: é assinatura de pessoa física de R$39; cada campo a
// mais aqui custa conversão. Quem precisa de nota/PJ fala no WhatsApp.

import { useState, type FormEvent } from 'react'
import { gaEvent } from '@/lib/gtag'
import { maskPhone } from '@/lib/format'
import CampoDocumento, { type PessoaTipo } from '@/components/checkout/CampoDocumento'
import { CLASSES } from '@/components/checkout/tema'
import type { PlanoEtt, PlanoEttId } from '@/lib/ett'

const c = CLASSES.dark
const brl = (centavos: number) => (centavos / 100).toFixed(2).replace('.', ',')

export default function AssinaturaEttForm({ planos }: { planos: PlanoEtt[] }) {
  const [planoId, setPlanoId] = useState<PlanoEttId>(planos[0].id)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [pessoaTipo, setPessoaTipo] = useState<PessoaTipo>('PF')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [consentimento, setConsentimento] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  /** caminho sem redirect: assinatura existe, mas não temos link de cobrança pra abrir */
  const [aviso, setAviso] = useState<string | null>(null)

  const plano = planos.find((p) => p.id === planoId) ?? planos[0]

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setAviso(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/ett/assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: planoId,
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          telefone: telefone.replace(/\D/g, ''),
          cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
          consentimento,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data?.error ?? 'Falha ao criar a assinatura. Tenta de novo.')
        setSubmitting(false)
        return
      }

      // Já assinava: nunca cria uma segunda recorrência — manda pagar a que existe.
      if (data.duplicada && !data.invoiceUrl) {
        setAviso(
          'Você já tem uma assinatura ativa com esse e-mail. Se a cobrança não chegou, chama a gente no WhatsApp que a gente reenvia.'
        )
        setSubmitting(false)
        return
      }

      if (data.invoiceUrl) {
        gaEvent('begin_checkout', {
          currency: 'BRL',
          value: plano.valorCentavos / 100,
          items: [
            {
              item_id: 'ett-assinatura',
              item_name: 'ETT — Trilha de Dedicação',
              item_variant: planoId,
              price: plano.valorCentavos / 100,
              quantity: 1,
            },
          ],
        })
        window.location.href = data.invoiceUrl
        return
      }

      // Assinatura criada, mas o Asaas ainda não devolveu a cobrança do 1º ciclo.
      // Não é erro: o boleto/PIX cai no e-mail. Só não dá pra redirecionar.
      setAviso(
        'Assinatura criada. A cobrança do primeiro ciclo chega no seu e-mail em instantes — se não aparecer, chama a gente no WhatsApp.'
      )
      setSubmitting(false)
    } catch {
      setErro('Erro de rede. Tenta de novo.')
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 space-y-5 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6"
    >
      <div className="space-y-3">
        <h2 className="text-lg font-bold">Como você quer pagar</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {planos.map((p) => {
            const ativo = p.id === planoId
            return (
              <label
                key={p.id}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  ativo
                    ? 'border-[var(--azuris-cyan)] bg-[var(--azuris-cyan)]/5'
                    : 'border-[var(--azuris-surface)] bg-[var(--azuris-ink)] hover:border-[var(--azuris-mist)]/50'
                }`}
              >
                <input
                  type="radio"
                  name="plano"
                  checked={ativo}
                  onChange={() => setPlanoId(p.id)}
                  className="sr-only"
                />
                <div className="font-bold">{p.label}</div>
                <div className="text-2xl font-black">R$ {brl(p.valorCentavos)}</div>
                <div className="text-xs text-[var(--text-muted)]">{p.unidade}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{p.nota}</div>
              </label>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">Seus dados</h2>

        <div>
          <label className={c.rotulo}>Nome completo</label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className={c.campo}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={c.rotulo}>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className={c.campo}
            />
          </div>
          <div>
            <label className={c.rotulo}>Telefone (WhatsApp)</label>
            <input
              type="tel"
              required
              minLength={14}
              value={telefone}
              onChange={(e) => setTelefone(maskPhone(e.target.value))}
              placeholder="(41) 99999-9999"
              className={c.campo}
            />
          </div>
        </div>

        <CampoDocumento
          pessoaTipo={pessoaTipo}
          onPessoaTipoChange={setPessoaTipo}
          valor={cpfCnpj}
          onChange={setCpfCnpj}
          ajuda="Necessário pra emissão da cobrança recorrente."
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          required
          checked={consentimento}
          onChange={(e) => setConsentimento(e.target.checked)}
          className={`mt-0.5 size-4 ${c.acento}`}
        />
        <span className="text-[var(--text-secondary)]">
          Autorizo a Azuris a usar meus dados para emissão da cobrança e contato sobre a assinatura, conforme a LGPD.
        </span>
      </label>

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>
      )}

      {aviso && (
        <div className="rounded-lg border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
          {aviso}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-to-r from-[var(--azuris-cyan)] to-[var(--accent-violet)] px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Processando…' : `Assinar por R$ ${brl(plano.valorCentavos)} ${plano.unidade}`}
      </button>

      <p className="text-center text-xs text-[var(--text-muted)]">
        Vai abrir o checkout seguro do Asaas, onde você escolhe PIX, boleto ou cartão. No cartão a renovação é
        automática; cancela quando quiser.
      </p>
    </form>
  )
}
