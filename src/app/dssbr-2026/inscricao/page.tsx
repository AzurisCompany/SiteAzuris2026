import type { Metadata } from 'next'
import { dssMetadata } from '../metadata'
import VendasEncerradas from '../VendasEncerradas'

// VENDAS ENCERRADAS em 08/10/2026 — FullPass (Lote 3, R$887) e o ingresso oculto
// Estudante (R$400, `?tipo=estudante`). A URL fica de pé com o aviso porque o link
// circulou (e o One Day redireciona pra cá). O POST /api/dssbr-2026/inscricao saiu
// junto; venda pontual segue pela cobrança avulsa do admin. `InscricaoForm.tsx` fica:
// o checkout do ETT reaproveita o formulário. A página de obrigado também fica — PIX
// já gerado continua pagável na fatura do Asaas.
export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/inscricao',
  title: 'Inscrições encerradas — DSS 2026 · Data Science Summit Brasil',
  description: 'As inscrições do FullPass do DSS 2026 (27–29/out, Curitiba) pelo site estão encerradas.',
  noindex: true,
})

export default function InscricaoEncerradaPage() {
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
            titulo="Inscrições do FullPass encerradas"
            waContexto="Oi! Abri o checkout do FullPass do DSS 2026, vi que as inscrições encerraram e ainda quero ir."
          />
        </div>
      </div>
    </main>
  )
}
