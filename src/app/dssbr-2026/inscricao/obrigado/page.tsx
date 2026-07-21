import type { Metadata } from 'next'
import { getProduto } from '@/lib/produtos'
import { dssMetadata } from '../../metadata'

const PRODUTO = getProduto('dss-2026')

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/inscricao/obrigado',
  title: 'Inscrição enviada — DSS 2026 · Data Science Summit Brasil',
  description: 'Sua inscrição no DSS 2026 foi enviada. Nos vemos em 27–29 de outubro, em Curitiba.',
  noindex: true,
})

export default function ObrigadoPage() {
  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)] flex items-center">
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-emerald)]/15 border border-[var(--accent-emerald)]/40">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-emerald)]" />
          </svg>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
          Inscrição <span className="text-[var(--azuris-cyan)]">enviada!</span>
        </h1>

        <p className="mt-4 text-[var(--text-secondary)] leading-relaxed">
          Recebemos sua inscrição no <strong className="text-[var(--text-primary)]">Data Science Summit Brasil 2026</strong>.
          Assim que o pagamento for confirmado, você recebe um e-mail com a confirmação do ingresso e os próximos passos.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6 text-left text-sm">
          <h2 className="font-bold mb-3 text-[var(--azuris-cyan)]">O que acontece agora</h2>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li className="flex gap-2">
              <span className="text-[var(--azuris-cyan)]">1.</span>
              <span>Se você escolheu <strong>PIX</strong>: o QR Code já está disponível no checkout. Pague em até 3 dias.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--azuris-cyan)]">2.</span>
              <span>Se você escolheu <strong>cartão</strong>: a cobrança foi feita e em alguns minutos chega a confirmação por e-mail.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--azuris-cyan)]">3.</span>
              <span>Com o pagamento confirmado, seu ingresso do DSS 2026 está garantido. Guarde o e-mail de confirmação.</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={PRODUTO.voltarUrl}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] px-5 py-2.5 text-sm font-semibold hover:border-[var(--azuris-cyan)]/40 transition-colors"
          >
            Voltar pro DSS 2026
          </a>
          <a
            href="mailto:binhara@azuris.com.br"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--azuris-cyan)]/15 border border-[var(--azuris-cyan)]/40 px-5 py-2.5 text-sm font-semibold text-[var(--azuris-cyan)] hover:bg-[var(--azuris-cyan)]/25 transition-colors"
          >
            Dúvida? Manda email
          </a>
        </div>
      </div>
    </main>
  )
}
