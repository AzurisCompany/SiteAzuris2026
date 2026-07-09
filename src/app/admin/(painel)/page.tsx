import Link from 'next/link'
import {
  resumoFinanceiro,
  resumoPorTipo,
  labelProduto,
  labelTipo,
  brl,
  type ResumoProduto,
  type ResumoTipo,
} from '@/lib/admin-queries'
import SyncAllButton from './SyncAllButton'

export const dynamic = 'force-dynamic'

function Kpi({ rotulo, valor, sub }: { rotulo: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-4">
      <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{rotulo}</div>
      <div className="mt-1 text-2xl font-black">{valor}</div>
      {sub && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{sub}</div>}
    </div>
  )
}

export default async function DashboardPage() {
  let resumo: ResumoProduto[] = []
  let tipos: ResumoTipo[] = []
  let erro: string | null = null
  try {
    ;[resumo, tipos] = await Promise.all([resumoFinanceiro(), resumoPorTipo()])
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro ao consultar o banco.'
  }

  // Agrupa o breakdown por produto pra abrir dentro de cada card.
  const tiposPorCurso = new Map<string, ResumoTipo[]>()
  for (const t of tipos) {
    const arr = tiposPorCurso.get(t.curso_slug) ?? []
    arr.push(t)
    tiposPorCurso.set(t.curso_slug, arr)
  }

  const tot = resumo.reduce(
    (a, r) => ({
      criadas: a.criadas + r.criadas,
      pagas: a.pagas + r.pagas,
      pendentes: a.pendentes + r.pendentes,
      bruto: a.bruto + r.bruto_pago_centavos,
      liquido: a.liquido + r.liquido_pago_centavos,
      taxa: a.taxa + r.taxa_pago_centavos,
      pendenteValor: a.pendenteValor + r.pendente_centavos,
    }),
    { criadas: 0, pagas: 0, pendentes: 0, bruto: 0, liquido: 0, taxa: 0, pendenteValor: 0 }
  )
  const conversao = tot.criadas > 0 ? Math.round((tot.pagas / tot.criadas) * 100) : 0

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Visão geral</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Vendas consolidadas dos produtos com checkout próprio.</p>
        </div>
        <SyncAllButton />
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Falha ao carregar dados: {erro}
        </div>
      )}

      {/* Consolidado */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi rotulo="Líquido recebido" valor={brl(tot.liquido)} sub={`${tot.pagas} pagas`} />
        <Kpi rotulo="Bruto vendido" valor={brl(tot.bruto)} sub={`taxa Asaas ${brl(tot.taxa)}`} />
        <Kpi rotulo="A receber (pendente)" valor={brl(tot.pendenteValor)} sub={`${tot.pendentes} pendentes`} />
        <Kpi rotulo="Conversão" valor={`${conversao}%`} sub={`${tot.pagas}/${tot.criadas} criadas`} />
      </section>

      {/* Por produto */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">Por produto</h2>
        {resumo.length === 0 && !erro && (
          <p className="text-sm text-[var(--text-muted)]">Nenhuma inscrição registrada ainda.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {resumo.map((r) => {
            const ticket = r.pagas > 0 ? r.bruto_pago_centavos / r.pagas : 0
            const breakdown = tiposPorCurso.get(r.curso_slug) ?? []
            // Só vale mostrar a abertura quando há mais de uma linha OU um tipo nomeado.
            const mostrarBreakdown = breakdown.length > 1 || breakdown.some((t) => t.tipo_ingresso != null)
            return (
              <div
                key={r.curso_slug}
                className="rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-5"
              >
                <Link href={`/admin/vendas?curso=${encodeURIComponent(r.curso_slug)}`} className="block hover:opacity-90">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{labelProduto(r.curso_slug)}</h3>
                    <span className="text-xs text-[var(--text-muted)]">{r.criadas} inscrições</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Líquido recebido</div>
                      <div className="text-lg font-black text-[var(--accent-emerald)]">{brl(r.liquido_pago_centavos)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Bruto</div>
                      <div className="text-lg font-bold">{brl(r.bruto_pago_centavos)}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                    <span>✅ {r.pagas} pagas</span>
                    <span>⏳ {r.pendentes} pendentes</span>
                    <span>⚠️ {r.vencidas} vencidas</span>
                    <span>✖️ {r.encerradas} encerradas</span>
                    <span>🎟️ ticket {brl(ticket)}</span>
                  </div>
                </Link>

                {mostrarBreakdown && (
                  <div className="mt-4 border-t border-[var(--azuris-surface)] pt-3">
                    <div className="mb-2 text-xs uppercase tracking-widest text-[var(--text-muted)]">Por tipo</div>
                    <div className="space-y-1.5">
                      {breakdown.map((t) => {
                        const tTicket = t.pagas > 0 ? t.bruto_pago_centavos / t.pagas : 0
                        return (
                          <Link
                            key={`${t.curso_slug}:${t.tipo_ingresso ?? '_'}`}
                            href={`/admin/vendas?curso=${encodeURIComponent(t.curso_slug)}${
                              t.tipo_ingresso ? `&tipo=${encodeURIComponent(t.tipo_ingresso)}` : ''
                            }`}
                            className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--azuris-surface)]/40"
                          >
                            <span className="min-w-0 flex-1 truncate font-medium">{labelTipo(t.tipo_ingresso)}</span>
                            <span className="text-xs text-[var(--text-muted)]">{t.pagas} pagas</span>
                            <span className="text-xs text-[var(--text-muted)]">ticket {brl(tTicket)}</span>
                            <span className="w-24 text-right font-bold text-[var(--accent-emerald)]">
                              {brl(t.liquido_pago_centavos)}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
