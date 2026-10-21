import type { Metadata } from 'next'
import { dssMetadata } from '../metadata'
import VendasEncerradas from '../VendasEncerradas'

// VENDAS ENCERRADAS em 21/10/2026 — Ingresso VIP (Lote 3, R$1.657, último lote). Era o
// último ingresso à venda no site: daqui pra frente o DSS 2026 só vende por WhatsApp
// (cobrança avulsa do admin). A URL fica de pé com o aviso porque o link circulou
// (dssbr.com.br, WhatsApp, cupons). O POST /api/dss-vip/inscricao saiu junto; os tipos
// `dss-vip-2026` ficam no banco — a cobrança avulsa usa o catálogo.
export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/vip',
  title: 'Ingresso VIP encerrado — DSS 2026 · Data Science Summit Brasil',
  description: 'As inscrições do ingresso VIP do DSS 2026 (27–29/out, Curitiba) pelo site estão encerradas.',
  noindex: true,
})

export default function VipEncerradoPage() {
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
            titulo="Ingresso VIP encerrado"
            encerrado="ingresso VIP"
            waContexto="Oi! Abri o checkout do ingresso VIP do DSS 2026, vi que as inscrições encerraram e ainda quero ir."
          />
        </div>
      </div>
    </main>
  )
}
