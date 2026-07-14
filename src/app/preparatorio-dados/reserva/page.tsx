import type { Metadata } from 'next'
import { CalendarClock, GraduationCap, Tag } from 'lucide-react'
import { getProduto } from '@/lib/produtos'
import { hojeBRT } from '@/lib/format'
import { listarTiposAtivos, contarInscritosPorTipo, disponibilidadeDoTipo } from '@/lib/tipos-ingresso'
import ReservaForm from './ReservaForm'

// Lista de espera do preparatório — tema dark padrão do site (o tema claro do
// /gubigdata é exceção do evento, não se aplica aqui).
const PRODUTO = getProduto('preparatorio-dados')
const TIPO_ID = 'reserva'

export const metadata: Metadata = {
  title: 'Reserva — Curso Preparatório de Dados | Azuris',
  description:
    'Reserve seu interesse no curso preparatório de Python, SQL e Docker. Sem pagamento e sem compromisso: você é avisado na abertura e garante o desconto de fundador.',
  robots: { index: false, follow: false }, // página de captura; a landing do curso é a indexável
}

export const dynamic = 'force-dynamic'

export default async function ReservaPreparatorioPage() {
  // Tolerante a banco sem migração: sem o tipo 'reserva' ativo, a página explica
  // que a lista ainda não abriu em vez de deixar o form dar 400 no envio.
  let aberta = false
  try {
    const [tipos, inscritos] = await Promise.all([
      listarTiposAtivos(PRODUTO.slug),
      contarInscritosPorTipo(PRODUTO.slug),
    ])
    const tipo = tipos.find((t) => t.tipo_id === TIPO_ID)
    aberta = !!tipo && disponibilidadeDoTipo(tipo, hojeBRT(), inscritos[TIPO_ID] ?? 0).disponivel
  } catch {
    aberta = false
  }

  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <a
          href={PRODUTO.voltarUrl}
          className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--azuris-cyan)]"
        >
          {PRODUTO.voltarLabel}
        </a>

        <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
          Reserve sua vaga no <span className="text-[var(--azuris-cyan)]">Preparatório de Dados</span>
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Se você ainda não tem Python, SQL e Docker no dia a dia, o Lakehouse vai passar rápido demais. O preparatório
          existe pra te levar até esse ponto de partida.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
          <div className="mb-4 text-xs uppercase tracking-widest text-[var(--text-muted)]">O que é a reserva</div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Tag className="mt-0.5 size-4 shrink-0 text-[var(--azuris-cyan)]" />
              <span>
                <strong>Sem pagamento agora e sem compromisso.</strong> Reservar não é comprar — é dizer que te interessa.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-[var(--azuris-cyan)]" />
              <span>
                <strong>Você é avisado primeiro na abertura</strong>, por e-mail ou WhatsApp, antes de qualquer
                divulgação aberta.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <GraduationCap className="mt-0.5 size-4 shrink-0 text-[var(--azuris-cyan)]" />
              <span>
                <strong>Desconto de fundador</strong> pra quem está na lista quando as inscrições abrirem.
              </span>
            </li>
          </ul>

          <p className="mt-5 border-t border-[var(--azuris-surface)] pt-4 text-xs text-[var(--text-muted)]">
            Sendo honesto: o preparatório ainda está sendo montado e não tem data. A reserva serve pra dimensionar a
            turma e definir o conteúdo — por isso pedimos seu WhatsApp: a gente quer entender o que você já sabe pra
            montar o curso em cima disso. Se nunca sair do papel, você só recebe um aviso dizendo isso.
          </p>
        </div>

        {aberta ? (
          <ReservaForm />
        ) : (
          <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6 text-sm text-[var(--text-secondary)]">
            A lista de reservas abre em breve. Enquanto isso, dá uma olhada no{' '}
            <a href="/lakehouse-comunidade" className="font-semibold text-[var(--azuris-cyan)] underline">
              curso Lakehouse: Pipeline na Prática
            </a>
            .
          </div>
        )}

        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          Seus dados são usados só pra falar com você sobre este curso. Sem repasse pra terceiros e sem cobrança — você
          pode pedir remoção da lista a qualquer momento, por e-mail ou WhatsApp.
        </p>
      </div>
    </main>
  )
}
