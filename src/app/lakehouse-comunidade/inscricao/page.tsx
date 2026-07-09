import type { Metadata } from 'next'
import { determinarLotePorPerfil, normalizarPerfil } from '@/lib/db'
import InscricaoForm from './InscricaoForm'

export const metadata: Metadata = {
  title: 'Inscrição — Lakehouse: Pipeline na Prática | Azuris',
  description:
    'Garanta sua vaga no curso Lakehouse: Pipeline na Prática. Pagamento via PIX à vista (5% off) ou cartão em até 5x (1x à vista, 2x-5x com juros).',
  robots: { index: false, follow: false }, // página de checkout, sem indexação
}

export const dynamic = 'force-dynamic'

function pix(reais: number): number {
  return Number((reais * 0.95).toFixed(2))
}

export default async function InscricaoPage({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string }>
}) {
  const { perfil: perfilParam } = await searchParams
  const perfilInicial = normalizarPerfil(perfilParam)

  const [membro, naoMembro] = await Promise.all([
    determinarLotePorPerfil('membro'),
    determinarLotePorPerfil('nao-membro'),
  ])

  const precos = {
    membro: {
      base: membro.preco_centavos / 100,
      pix: pix(membro.preco_centavos / 100),
      vagas: membro.vagasRestantes,
    },
    'nao-membro': {
      base: naoMembro.preco_centavos / 100,
      pix: pix(naoMembro.preco_centavos / 100),
      vagas: naoMembro.vagasRestantes,
    },
  }

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

        {/* O que está incluso (independe do perfil) */}
        <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3">
            O que está incluso
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              Curso completo (20h, 5 módulos) + aulas gravadas com acesso vitalício
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              Curso em andamento — entre quando quiser e siga módulo a módulo, no seu ritmo
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              Encontros temáticos ao vivo + mentorias 1:1 agendáveis pra tirar dúvidas
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              Discord vitalício + cheat sheets + certificado
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              Ingresso Data Science Summit Brasil 2026 incluso (R$ 520)
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              Pix à vista com 5% off · Cartão em até 5x (1x à vista, 2x-5x com juros)
            </div>
          </div>
        </div>

        <InscricaoForm perfilInicial={perfilInicial} precos={precos} />

        <p className="mt-8 text-xs text-[var(--text-muted)] text-center">
          Pagamento processado pelo Asaas com segurança. Seus dados são usados apenas pra emissão da cobrança e contato pedagógico.
        </p>
      </div>
    </main>
  )
}
