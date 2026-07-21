import type { ReactNode } from 'react'
import { Users } from 'lucide-react'
import type { ProdutoConfig } from '@/lib/produtos'
import InscricaoForm from './inscricao/InscricaoForm'

// Corpo compartilhado dos checkouts single-price do DSS (One Day e o combo One Day +
// curso). Preço SEMPRE derivado do registry do produto — o servidor recalcula de novo
// no POST (ver checkout-produto). Escada de lotes e âncora "de" são opcionais.
const WA_PHONE = '5541998003687' // +55 (41) 99800-3687

export interface LoteExibicao {
  nome: string
  valor: number
  atual: boolean
}

interface Props {
  produto: ProdutoConfig
  /** endpoint do POST de inscrição deste produto */
  endpoint: string
  gaItem: { id: string; name: string }
  h1: ReactNode
  subtitulo: ReactNode
  /** rótulo em caixa-alta no topo do card de resumo (ex.: "Lote 1 · a partir de") */
  resumoLabel: string
  /** escada de lotes só pra exibição; ausente = sem escada */
  lotes?: LoteExibicao[]
  /** o que está incluído no ingresso */
  inclui: string[]
  /** contexto pra prefill do WhatsApp corporativo */
  waContexto: string
  /** nota de valor opcional abaixo do preço (ex.: framing do combo) */
  notaValor?: ReactNode
}

export default function PasseCheckout({
  produto,
  endpoint,
  gaItem,
  h1,
  subtitulo,
  resumoLabel,
  lotes,
  inclui,
  waContexto,
  notaValor,
}: Props) {
  const precoBaseReais = produto.precoCentavos / 100
  const precoDeVendaReais = produto.precoDeVendaCentavos / 100
  const precoPixReais = Number((precoBaseReais * (1 - produto.pixDescontoPct)).toFixed(2))
  const precoCartaoBaseReais = Number((precoBaseReais * (1 + produto.cartaoAcrescimoPct)).toFixed(2))
  const temAncora = precoDeVendaReais > precoPixReais
  const descontoPct = temAncora ? Math.round((1 - precoPixReais / precoDeVendaReais) * 100) : 0

  const waUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(waContexto)}`
  const brl = (v: number) => v.toFixed(2).replace('.', ',')

  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <a
          href={produto.voltarUrl}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--azuris-cyan)] transition-colors"
        >
          {produto.voltarLabel}
        </a>

        <h1 className="mt-6 text-3xl sm:text-4xl font-bold leading-tight">{h1}</h1>

        <p className="mt-3 text-sm text-[var(--text-secondary)]">{subtitulo}</p>

        {/* Compras corporativas / em grupo */}
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 size-5 shrink-0 text-[var(--accent-emerald)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">Compra para grupo ou empresa?</strong>{' '}
              Temos pacotes com desconto por volume — fale com a gente.
            </p>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          >
            Falar no WhatsApp
          </a>
        </div>

        {/* Resumo do ingresso */}
        <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{resumoLabel}</div>
              {temAncora && (
                <div className="mt-1 text-sm text-[var(--text-muted)] line-through">
                  R$ {brl(precoDeVendaReais)} no lote final
                </div>
              )}
              <div className="text-3xl font-black">
                R$ {brl(precoPixReais)}
                <span className="ml-2 text-base font-semibold text-[var(--text-muted)]">no PIX ou cartão 1x</span>
              </div>
            </div>
            {temAncora && (
              <span className="inline-flex items-center rounded-full bg-[var(--accent-emerald)]/15 px-3 py-1 text-xs font-semibold text-[var(--accent-emerald)]">
                -{descontoPct}% vs. lote final
              </span>
            )}
          </div>

          {notaValor && <div className="mt-3 text-sm text-[var(--text-secondary)]">{notaValor}</div>}

          {/* Escada de lotes (opcional) */}
          {lotes && lotes.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {lotes.map((l) => (
                <div
                  key={l.nome}
                  className={`rounded-xl border-2 p-3 text-center ${
                    l.atual
                      ? 'border-[var(--azuris-cyan)] bg-[var(--azuris-cyan)]/5'
                      : 'border-[var(--azuris-surface)] bg-[var(--azuris-ink)]'
                  }`}
                >
                  <div className="text-xs font-semibold text-[var(--text-muted)]">{l.nome}</div>
                  <div className="text-lg font-black">R$ {l.valor}</div>
                  {l.atual && (
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--azuris-cyan)]">
                      vendendo agora
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inclusões */}
          <div className="mt-5 space-y-2 text-sm">
            {inclui.map((item) => (
              <div key={item} className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--azuris-cyan)]">●</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <InscricaoForm
          precoDeVendaReais={precoDeVendaReais}
          precoPixReais={precoPixReais}
          precoCartaoBaseReais={precoCartaoBaseReais}
          maxParcelas={produto.maxParcelas}
          endpoint={endpoint}
          gaItem={gaItem}
        />

        <p className="mt-8 text-xs text-[var(--text-muted)] text-center">
          Pagamento processado pelo Asaas com segurança. Seus dados são usados apenas pra emissão da cobrança e contato
          sobre o evento.
        </p>
      </div>
    </main>
  )
}
