// /vendas — a página das vendedoras. Elas geram sozinhas o link com desconto do
// FullPass do DSS ([[cupom]]); ninguém do time precisa entrar no admin.
//
// noindex + fora do menu: não é página de público, é ferramenta interna. O que
// protege é o código, não o segredo da URL.
import type { Metadata } from 'next'
import { Ticket } from 'lucide-react'
import { CUPOM_PCT_PADRAO, VALIDADE_HORAS_PADRAO } from '@/lib/cupom'
import GerarLinkForm from './GerarLinkForm'

export const metadata: Metadata = {
  title: 'Gerar link de desconto — Azuris',
  robots: { index: false, follow: false },
}

export default function VendasPage() {
  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--azuris-cyan)]">
          <Ticket className="size-4" />
          DSS 2026 · FullPass
        </div>

        <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
          Gere seu link com <span className="text-[var(--accent-emerald)]">{CUPOM_PCT_PADRAO}% de desconto</span>
        </h1>

        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Digita seu código, gera o link e manda pro cliente. Cada link vale{' '}
          <strong className="text-[var(--text-primary)]">{VALIDADE_HORAS_PADRAO} horas</strong> — depois disso ele para
          de dar desconto sozinho, e o checkout volta ao preço cheio.
        </p>

        <div className="mt-8">
          <GerarLinkForm />
        </div>

        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          Toda inscrição que entrar pelo seu link fica registrada no seu nome.
        </p>
      </div>
    </main>
  )
}
