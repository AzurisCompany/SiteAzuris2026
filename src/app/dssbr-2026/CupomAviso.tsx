import { BadgePercent, Clock } from 'lucide-react'
import { formatarValidade } from '@/lib/cupom'
import { aplicarDesconto, type DescontoAplicado } from '@/lib/cupons'

// Tarja de cupom dos checkouts do DSS ([[cupons]]). Dois estados:
//  - link que não vale mais (vencido, desligado, esgotado, de outro ingresso): a compra
//    segue no preço normal e a tarja diz por quê. Perder a venda seria o pior desfecho.
//  - desconto aplicado: os preços abaixo JÁ saem com desconto; a tarja só explica
//    por que está mais barato e, no link de vendedora, até quando vale.
interface Props {
  cupom: DescontoAplicado | null
  /** veio com `?c=`/`?d=`, mas o cupom foi recusado */
  morto: boolean
  /** preço cheio de 1 ingresso, em centavos — o "de" riscado */
  precoCheioCentavos: number
}

const reais = (centavos: number) => (centavos / 100).toFixed(2).replace('.', ',')

export default function CupomAviso({ cupom, morto, precoCheioCentavos }: Props) {
  if (morto) {
    return (
      <div className="mt-6 rounded-xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-4">
        <p className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
          <Clock className="mt-0.5 size-4 shrink-0 text-[var(--text-muted)]" />
          <span>
            O link de desconto que você usou <strong className="text-[var(--text-primary)]">expirou</strong> — os
            valores abaixo são os normais. Se alguém do time te enviou esse link, peça um novo.
          </span>
        </p>
      </div>
    )
  }
  if (!cupom) return null
  return (
    <div className="mt-6 rounded-xl border border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 p-4">
      <div className="flex items-start gap-3">
        <BadgePercent className="mt-0.5 size-5 shrink-0 text-[var(--accent-emerald)]" />
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">Desconto de {cupom.pct}% aplicado nesta página</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--text-muted)] line-through">R$ {reais(precoCheioCentavos)}</span>{' '}
            <strong className="text-[var(--accent-emerald)]">
              R$ {reais(aplicarDesconto(precoCheioCentavos, cupom.pct))}
            </strong>{' '}
            — o desconto já está nos valores abaixo.
          </p>
          {cupom.exp != null && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Clock className="size-3.5" />
              Este link vale até {formatarValidade(cupom.exp)}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Os dois parâmetros de cupom da URL: `?d=` (vendedora, assinado) e `?c=` (parceiro). */
export interface EntradaCupom {
  d?: string
  c?: string
}
