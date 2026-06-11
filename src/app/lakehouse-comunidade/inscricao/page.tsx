import type { Metadata } from 'next'
import { determinarLoteAtivo } from '@/lib/db'
import InscricaoForm from './InscricaoForm'

export const metadata: Metadata = {
  title: 'Inscrição — Lakehouse: Pipeline na Prática | Azuris',
  description:
    'Garanta sua vaga no curso Lakehouse: Pipeline na Prática. Pagamento via PIX à vista (5% off) ou cartão em até 5x (1x à vista, 2x-5x com juros).',
  robots: { index: false, follow: false }, // página de checkout, sem indexação
}

export const dynamic = 'force-dynamic'

export default async function InscricaoPage() {
  const { lote, vagasRestantes, preco_centavos } = await determinarLoteAtivo()
  const precoReais = preco_centavos / 100
  const precoPixReais = Number((precoReais * 0.95).toFixed(2))
  const esgotado = vagasRestantes <= 0

  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <a
          href="/lakehouse-comunidade"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--azuris-cyan)] transition-colors"
        >
          ← voltar pro curso
        </a>

        <h1 className="mt-6 text-3xl sm:text-4xl font-bold leading-tight">
          Sua inscrição no <span className="text-[var(--azuris-cyan)]">Lakehouse: Pipeline na Prática</span>
        </h1>

        {/* Resumo do lote */}
        <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
                {lote === 'lote1' ? 'Lote 1 · Aberto' : 'Lote 2'}
              </div>
              <div className="mt-1 text-3xl font-black">
                R$ {precoReais.toFixed(2).replace('.', ',')}
              </div>
            </div>
            {!esgotado && (
              <span className="inline-flex items-center rounded-full bg-[var(--accent-emerald)]/15 px-3 py-1 text-xs font-semibold text-[var(--accent-emerald)]">
                {vagasRestantes} {vagasRestantes === 1 ? 'vaga restante' : 'vagas restantes'}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              Curso completo (20h) + Discord vitalício + cheat sheets + certificado
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              Ingresso Data Science Summit Brasil 2026 incluso (R$ 520)
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              Pix à vista: <strong className="text-[var(--text-primary)]">R$ {precoPixReais.toFixed(2).replace('.', ',')}</strong>
              {' '}(5% off) · Cartão: R$ {precoReais.toFixed(2).replace('.', ',')} em até 5x (1x à vista, 2x-5x com juros)
            </div>
          </div>
        </div>

        {esgotado ? (
          <div className="mt-8 rounded-2xl border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/10 p-6 text-center">
            <p className="text-lg font-semibold">Vagas esgotadas no momento</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Mande um email pra <a href="mailto:binhara@azuris.com.br" className="underline">binhara@azuris.com.br</a> pra entrar na fila de espera da próxima turma.
            </p>
          </div>
        ) : (
          <InscricaoForm
            precoBaseReais={precoReais}
            precoPixReais={precoPixReais}
          />
        )}

        <p className="mt-8 text-xs text-[var(--text-muted)] text-center">
          Pagamento processado pelo Asaas com segurança. Seus dados são usados apenas pra emissão da cobrança e contato pedagógico.
        </p>
      </div>
    </main>
  )
}
