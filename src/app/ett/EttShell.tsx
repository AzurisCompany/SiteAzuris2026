import type { ReactNode } from 'react'

// Moldura comum dos dois checkouts do English Talk Time (adesão e assinatura).
// Mesmo tema escuro dos outros checkouts do site; o que muda é a linguagem —
// aqui não é ingresso de evento, é entrada num programa que continua todo mês.
//
// A isenção de quem já está numa trilha gratuita aparece nas duas telas de
// propósito: é a dúvida nº 1 de quem chega pela home do ETT.

export const WA_ETT = '5541998003687' // +55 (41) 99800-3687

export default function EttShell({
  voltarLabel = '← voltar pro English Talk Time',
  voltarUrl = 'https://englishtalktime.com.br',
  h1,
  subtitulo,
  children,
  rodape,
}: {
  voltarLabel?: string
  voltarUrl?: string
  h1: ReactNode
  subtitulo: ReactNode
  children: ReactNode
  /** linha final da página (cross-link pro outro produto, dúvidas etc.) */
  rodape?: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <a
          href={voltarUrl}
          className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--azuris-cyan)]"
        >
          {voltarLabel}
        </a>

        <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">{h1}</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">{subtitulo}</p>

        {/* Isenção de quem já está dentro — a pergunta que trava a compra. */}
        <p className="mt-4 rounded-xl border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/5 p-4 text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Quem já está numa trilha gratuita não passa a pagar.</strong>{' '}
          Se você se cadastrou antes desta página mudar, sua adesão está isenta. Não existe cobrança retroativa.
        </p>

        {children}

        {rodape && <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">{rodape}</div>}

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          Pagamento processado pelo Asaas com segurança. Seus dados são usados apenas pra emissão da cobrança e contato
          sobre o programa.
        </p>
      </div>
    </main>
  )
}

/** Card de resumo (preço + o que inclui), compartilhado pelas duas telas. */
export function ResumoEtt({
  label,
  preco,
  unidade,
  nota,
  inclui,
}: {
  label: string
  /** já formatado, ex.: "R$ 70,00" */
  preco: string
  unidade: string
  nota?: ReactNode
  inclui: string[]
}) {
  return (
    <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
      <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
      <div className="text-3xl font-black">
        {preco}
        <span className="ml-2 text-base font-semibold text-[var(--text-muted)]">{unidade}</span>
      </div>
      {nota && <div className="mt-3 text-sm text-[var(--text-secondary)]">{nota}</div>}
      <div className="mt-5 space-y-2 text-sm">
        {inclui.map((item) => (
          <div key={item} className="flex items-start gap-2 text-[var(--text-secondary)]">
            <span className="mt-0.5 text-[var(--azuris-cyan)]">●</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
