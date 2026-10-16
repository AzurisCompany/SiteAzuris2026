import type { Metadata } from 'next'
import { dssMetadata } from '../metadata'
import VendasEncerradas from '../VendasEncerradas'

// VENDAS ENCERRADAS em 16/10/2026 — Ingresso Business (Lote 3, R$1.279, último lote).
// A URL fica de pé com o aviso porque o link circulou (dssbr.com.br, WhatsApp, cupons).
// O POST /api/dss-business/inscricao saiu junto; venda pontual segue pela cobrança avulsa
// do admin. Os tipos `dss-business-2026` ficam no banco — a cobrança avulsa usa o catálogo.
export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/business',
  title: 'Ingresso Business encerrado — DSS 2026 · Data Science Summit Brasil',
  description: 'As inscrições do ingresso Business do DSS 2026 (27–29/out, Curitiba) pelo site estão encerradas.',
  noindex: true,
})

export default function BusinessEncerradoPage() {
  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <a
          href="/dssbr-2026"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--azuris-cyan)] transition-colors"
        >
          ← voltar pro DSS 2026
        </a>
        <div className="mt-6">
          <VendasEncerradas
            titulo="Ingresso Business encerrado"
            encerrado="ingresso Business"
            waContexto="Oi! Abri o checkout do ingresso Business do DSS 2026, vi que as inscrições encerraram e ainda quero ir."
          />
        </div>
      </div>
    </main>
  )
}
