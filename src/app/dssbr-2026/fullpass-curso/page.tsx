import type { Metadata } from 'next'
import { getProduto } from '@/lib/produtos'
import { dssMetadata } from '../metadata'
import VendasEncerradas from '../VendasEncerradas'

// VENDAS ENCERRADAS em 08/10/2026 — combo FullPass + portal do curso "Lakehouse:
// Pipeline na Prática" (R$850), junto com o FullPass. A URL fica de pé com o aviso
// (o link circulou, e /one-day-curso redireciona pra cá); o POST
// /api/dss-fullpass-curso/inscricao saiu. O curso sozinho segue em /lakehouse-comunidade.
const PRODUTO = getProduto('dss-fullpass-curso-2026')

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/fullpass-curso',
  title: 'Combo encerrado — DSS 2026 · Data Science Summit Brasil',
  description: 'As vendas do combo FullPass + portal do curso do DSS 2026 estão encerradas.',
  noindex: true,
})

export default function FullPassCursoEncerradoPage() {
  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <a
          href={PRODUTO.voltarUrl}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--azuris-cyan)] transition-colors"
        >
          {PRODUTO.voltarLabel}
        </a>
        <div className="mt-6">
          <VendasEncerradas
            titulo="Combo FullPass + curso encerrado"
            waContexto="Oi! Abri o checkout do combo FullPass + curso do DSS 2026, vi que as vendas encerraram e ainda quero ir."
          />
        </div>
        <p className="mt-6 text-sm text-[var(--text-secondary)]">
          Quer só o curso?{' '}
          <a href="/lakehouse-comunidade" className="underline hover:text-[var(--azuris-cyan)]">
            Lakehouse: Pipeline na Prática
          </a>{' '}
          continua com inscrições abertas.
        </p>
      </div>
    </main>
  )
}
