import type { ReactNode } from 'react'
import { getProduto } from '@/lib/produtos'

// Moldura comum dos checkouts do English Talk Time (ativação, Dedicação e Aceleração).
// Mesmo tema escuro dos outros checkouts do site; o que muda é a linguagem —
// aqui não é ingresso de evento, é entrada num programa que continua todo mês.
//
// `isencao`: quem entrou antes da ativação paga existir não passa a pagar — só faz
// sentido na tela da ativação. `exigeAtivacao`: as duas trilhas começam no dia 31,
// depois da ativação; o aviso fica no topo pra ninguém assinar achando que pulou etapa.

export const WA_ETT = '5541998003687' // +55 (41) 99800-3687

const ATIVACAO_REAIS = getProduto('ett-adesao').precoCentavos / 100

export default function EttShell({
  voltarLabel = '← voltar pro English Talk Time',
  voltarUrl = 'https://englishtalktime.com.br',
  h1,
  subtitulo,
  children,
  rodape,
  isencao = false,
  exigeAtivacao = false,
  semCobranca = false,
}: {
  voltarLabel?: string
  voltarUrl?: string
  h1: ReactNode
  subtitulo: ReactNode
  children: ReactNode
  /** linha final da página (cross-link pro outro produto, dúvidas etc.) */
  rodape?: ReactNode
  isencao?: boolean
  exigeAtivacao?: boolean
  /** trilha de R$0: o rodapé não fala de pagamento */
  semCobranca?: boolean
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
        {isencao && (
          <p className="mt-4 rounded-xl border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/5 p-4 text-sm text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">Quem já está numa trilha gratuita não passa a pagar.</strong>{' '}
            Se você se cadastrou antes desta página mudar, está isento da ativação. Não existe cobrança retroativa.
          </p>
        )}

        {exigeAtivacao && (
          <p className="mt-4 rounded-xl border border-[var(--azuris-cyan)]/30 bg-[var(--azuris-cyan)]/5 p-4 text-sm text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">Antes, a ativação.</strong> Pra entrar nesta trilha, primeiro
            você faz a{' '}
            <a href="/ett/ativacao" className="font-semibold text-[var(--azuris-cyan)] hover:underline">
              ativação acompanhada de R$ {ATIVACAO_REAIS}
            </a>
            , que é o seu 1º mês. A trilha começa no dia 31.
          </p>
        )}

        {children}

        {rodape && <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">{rodape}</div>}

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          {semCobranca
            ? 'Nada é cobrado nesta trilha. Seus dados são usados apenas pra contato sobre o programa.'
            : 'Pagamento processado pelo Asaas com segurança. Seus dados são usados apenas pra emissão da cobrança e contato sobre o programa.'}
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
