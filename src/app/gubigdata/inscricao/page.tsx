import type { Metadata } from 'next'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { getProduto } from '@/lib/produtos'
import { hojeBRT } from '@/lib/format'
import {
  listarTiposAtivos,
  contarInscritosPorTipo,
  disponibilidadeDoTipo,
  precosDoTipo,
  ehGratuito,
} from '@/lib/tipos-ingresso'
import InscricaoGuForm, { type TipoGuOption } from './InscricaoGuForm'

const PRODUTO = getProduto('gubigdata-2026-07')

export const metadata: Metadata = {
  title: 'Inscrição — Encontro Presencial GU BigData & IA · 30 de julho',
  description:
    'Encontro presencial do GU BigData & IA em 30/07 no IEP, Curitiba: conhecimento como ativo e IA como infraestrutura corporativa. Ingresso Geral R$ 30 ou gratuito para associados.',
  robots: { index: false, follow: false }, // página de inscrição, divulgação vem do post/comunidade
}

export const dynamic = 'force-dynamic'

const AGENDA: Array<{ hora: string; item: string }> = [
  { hora: '18h30', item: 'Credenciamento e networking' },
  { hora: '19h00', item: 'Abertura — GU Big Data & IA' },
  { hora: '19h15', item: 'Tatiana Cruz — Como transformar conhecimento em ativos de alto valor na era da IA' },
  { hora: '20h00', item: 'Maicon Wendhausem — O Servidor de IA Corporativo: IA como infraestrutura, não promessa' },
  { hora: '21h00', item: 'Encerramento, networking e fotos (21h20: jantar opcional)' },
]

function dataBR(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default async function InscricaoGuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const tipoPre = sp.tipo || null

  // Tipos ativos + disponibilidade (janela de vendas / lotação), tolerante a
  // banco sem migração — nesse caso a página mostra "inscrições em breve".
  let tipoOptions: TipoGuOption[] = []
  try {
    const [tipos, inscritos] = await Promise.all([
      listarTiposAtivos(PRODUTO.slug),
      contarInscritosPorTipo(PRODUTO.slug),
    ])
    const hoje = hojeBRT()
    tipoOptions = tipos.map((t) => {
      const p = precosDoTipo(t)
      const disp = disponibilidadeDoTipo(t, hoje, inscritos[t.tipo_id] ?? 0)
      return {
        tipo_id: t.tipo_id,
        nome: t.nome,
        descricao: t.descricao,
        gratuito: ehGratuito(t),
        precoPixReais: p.precoPixReais,
        precoCartaoBaseReais: p.precoCartaoBaseReais,
        maxParcelas: p.maxParcelas,
        vendasAte: t.vendas_ate ? dataBR(t.vendas_ate) : null,
        disponivel: disp.disponivel,
        motivo: disp.motivo,
      }
    })
  } catch {
    tipoOptions = []
  }

  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <a
          href={PRODUTO.voltarUrl}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-emerald)] transition-colors"
        >
          {PRODUTO.voltarLabel}
        </a>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent-emerald)]/15 px-3 py-1 text-xs font-semibold text-[var(--accent-emerald)]">
          <Users className="size-3.5" /> Encontro da comunidade · GU BigData &amp; IA
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
          Encontro Presencial <span className="text-[var(--accent-emerald)]">GU BigData &amp; IA</span>
        </h1>
        <p className="mt-2 text-lg text-[var(--text-secondary)]">
          Conhecimento como ativo e IA como infraestrutura corporativa.
        </p>

        <div className="mt-5 flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-[var(--accent-emerald)]" />
            Quinta, 30 de julho de 2026 · a partir das 18h30
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-[var(--accent-emerald)]" />
            IEP — Instituto de Engenharia do Paraná · Rua Emiliano Perneta, 174 · Centro, Curitiba/PR
          </div>
        </div>

        {/* Agenda */}
        <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Programação</div>
          <ul className="mt-3 space-y-2 text-sm">
            {AGENDA.map((a) => (
              <li key={a.hora} className="flex gap-3 text-[var(--text-secondary)]">
                <span className="w-12 shrink-0 font-semibold text-[var(--accent-emerald)]">{a.hora}</span>
                <span>{a.item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Realização: GU Big Data &amp; IA · Rede Sol · SUCESU Paraná. Vagas limitadas.
          </p>
        </div>

        {tipoOptions.length > 0 ? (
          <InscricaoGuForm tipos={tipoOptions} defaultTipo={tipoPre} />
        ) : (
          <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6 text-sm text-[var(--text-secondary)]">
            As inscrições abrem em breve. Enquanto isso, acompanha o{' '}
            <a href="https://gubigdata.com.br" className="text-[var(--accent-emerald)] underline">
              site do GU BigData
            </a>
            .
          </div>
        )}

        <p className="mt-8 text-xs text-[var(--text-muted)] text-center">
          Evento da comunidade GU BigData &amp; IA. Inscrição processada pela infraestrutura da Azuris; pagamento (quando
          houver) via Asaas. Seus dados são usados só pra credenciamento e contato sobre o evento.
        </p>
      </div>
    </main>
  )
}
