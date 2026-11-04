import type { Metadata } from 'next'
import { getProduto } from '@/lib/produtos'
import { dssMetadata } from '../metadata'

// Upgrade Elite do DSS 2026: escolha entre o certificado digital e o impresso.
// Cada um tem checkout próprio (ver CertificadoCheckout). Link direto, fora do índice.
export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/certificado-elite',
  title: 'Upgrade Elite — certificado · DSS 2026',
  description: 'Certificado do Data Science Summit Brasil 2026: digital por R$ 30 ou impresso por R$ 50.',
  noindex: true,
})

const OPCOES = [
  { formato: 'digital', slug: 'certificado-elite-digital-dss-2026', entrega: 'chega no seu e-mail' },
  { formato: 'impresso', slug: 'certificado-elite-impresso-dss-2026', entrega: 'entrega combinada pelo WhatsApp' },
] as const

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CertificadoElitePage() {
  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <a
          href="/dssbr-2026"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--azuris-cyan)] transition-colors"
        >
          ← voltar pro DSS 2026
        </a>
        <h1 className="mt-6 text-3xl sm:text-4xl font-bold leading-tight">
          Upgrade <span className="text-[var(--azuris-cyan)]">Elite</span> — certificado do DSS 2026
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          O certificado do Data Science Summit Brasil 2026, para quem participou do congresso. Escolha o formato.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {OPCOES.map((o) => (
            <a
              key={o.formato}
              href={`/dssbr-2026/certificado-elite/${o.formato}`}
              className="block rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6 transition-colors hover:border-[var(--azuris-cyan)]"
            >
              <div className="text-xs uppercase tracking-widest text-[var(--azuris-cyan)]">Certificado {o.formato}</div>
              <div className="mt-1 text-4xl font-black">{brl(getProduto(o.slug).precoCentavos / 100)}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{o.entrega}</div>
              <div className="mt-4 text-sm font-semibold text-[var(--azuris-cyan)]">Comprar →</div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
