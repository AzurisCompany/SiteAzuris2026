import Link from 'next/link'
import {
  resumoTrafego,
  origensPorCanal,
  origensPorFonte,
  topPaginas,
  type ResumoTrafego,
  type LinhaDim,
  type PaginaView,
} from '@/lib/ga4'

export const dynamic = 'force-dynamic'

const PERIODOS = [
  { dias: 7, label: '7 dias' },
  { dias: 28, label: '28 dias' },
  { dias: 90, label: '90 dias' },
]

const nf = (n: number) => n.toLocaleString('pt-BR')

function Kpi({ rotulo, valor, sub }: { rotulo: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-4">
      <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{rotulo}</div>
      <div className="mt-1 text-2xl font-black">{valor}</div>
      {sub && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{sub}</div>}
    </div>
  )
}

function TabelaDim({ titulo, linhas }: { titulo: string; linhas: LinhaDim[] }) {
  const max = Math.max(...linhas.map((l) => l.sessoes), 1)
  return (
    <section className="rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--azuris-cyan)] mb-3">{titulo}</h2>
      {linhas.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Sem dados no período.</p>
      ) : (
        <ul className="space-y-2">
          {linhas.map((l) => (
            <li key={l.label} className="text-sm">
              <div className="flex justify-between gap-3">
                <span className="truncate text-[var(--text-secondary)]">{l.label}</span>
                <span className="font-semibold tabular-nums">{nf(l.sessoes)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-[var(--azuris-surface)]">
                <div className="h-full rounded-full bg-[var(--azuris-cyan)]/60" style={{ width: `${(l.sessoes / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default async function TrafegoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const dias = [7, 28, 90].includes(Number(sp.dias)) ? Number(sp.dias) : 28

  let resumo: ResumoTrafego | null = null
  let canais: LinhaDim[] = []
  let fontes: LinhaDim[] = []
  let paginas: PaginaView[] = []
  let erro: string | null = null
  try {
    ;[resumo, canais, fontes, paginas] = await Promise.all([
      resumoTrafego(dias),
      origensPorCanal(dias),
      origensPorFonte(dias),
      topPaginas(dias),
    ])
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro ao consultar o GA4.'
  }

  const naoConfigurado = erro?.includes('não configurada')

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tráfego</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Dados do Google Analytics (GA4).</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--azuris-surface)] p-1">
          {PERIODOS.map((p) => (
            <Link
              key={p.dias}
              href={`/admin/trafego?dias=${p.dias}`}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                dias === p.dias ? 'bg-[var(--azuris-cyan)] text-[var(--azuris-ink)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {naoConfigurado && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-200 space-y-2">
          <p className="font-bold">GA4 ainda não conectado.</p>
          <p>Pra ligar este painel, configure no Vercel (produção) e no <code>.env.local</code>:</p>
          <ul className="list-disc pl-5 space-y-1 text-amber-100/90">
            <li><code>GA4_PROPERTY_ID</code> — o ID numérico da propriedade (GA4 → Admin → Detalhes da propriedade).</li>
            <li><code>GA_SERVICE_ACCOUNT_JSON</code> — JSON da chave de um service account com papel &quot;Leitor&quot; na propriedade GA4.</li>
          </ul>
        </div>
      )}

      {erro && !naoConfigurado && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Falha ao consultar o GA4: {erro}
        </div>
      )}

      {resumo && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi rotulo="Usuários" valor={nf(resumo.usuarios)} sub={`últimos ${dias} dias`} />
            <Kpi rotulo="Sessões" valor={nf(resumo.sessoes)} />
            <Kpi rotulo="Pageviews" valor={nf(resumo.pageviews)} />
            <Kpi rotulo="Engajamento" valor={`${resumo.engajamento}%`} sub="sessões engajadas" />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <TabelaDim titulo="Origem por canal" linhas={canais} />
            <TabelaDim titulo="Origem por fonte" linhas={fontes} />
          </div>

          <section className="rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--azuris-cyan)] mb-3">Páginas mais acessadas</h2>
            {paginas.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Sem dados no período.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-[var(--azuris-surface)]/50">
                  {paginas.map((p) => (
                    <tr key={p.path}>
                      <td className="py-2 pr-3 text-[var(--text-secondary)] truncate max-w-0 w-full">{p.path}</td>
                      <td className="py-2 text-right font-semibold tabular-nums whitespace-nowrap">{nf(p.views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  )
}
