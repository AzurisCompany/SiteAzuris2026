import Link from 'next/link'
import {
  listarVendas,
  resumoFinanceiro,
  labelProduto,
  tabProduto,
  brl,
  PRODUTO_LABEL,
  STATUS_LABEL,
  STATUS_COR,
  type ResumoProduto,
} from '@/lib/admin-queries'
import type { InscricaoRow } from '@/lib/db'
import Filtros from './Filtros'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COR[status] ?? ''}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const curso = sp.curso || ''
  const status = sp.status || ''
  const billing = sp.billing || ''
  const busca = sp.busca || ''
  const page = Math.max(Number(sp.page ?? '1') || 1, 1)

  let rows: InscricaoRow[] = []
  let total = 0
  let erro: string | null = null
  let resumo: ResumoProduto[] = []
  try {
    const [res, r] = await Promise.all([
      listarVendas({ curso, status, billing, busca, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
      resumoFinanceiro(),
    ])
    rows = res.rows
    total = res.total
    resumo = r
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro ao consultar o banco.'
  }

  // Contagem por produto pras abas
  const countPorCurso: Record<string, number> = {}
  let countTodos = 0
  for (const r of resumo) {
    countPorCurso[r.curso_slug] = r.criadas
    countTodos += r.criadas
  }
  // Link de aba preservando os outros filtros (status/billing/busca), resetando página
  const tabHref = (slug: string) => {
    const u = new URLSearchParams()
    if (slug) u.set('curso', slug)
    if (status) u.set('status', status)
    if (billing) u.set('billing', billing)
    if (busca) u.set('busca', busca)
    const s = u.toString()
    return s ? `?${s}` : '/admin/vendas'
  }
  const abas = [
    { slug: '', label: 'Todos', count: countTodos },
    ...Object.keys(PRODUTO_LABEL).map((slug) => ({ slug, label: tabProduto(slug), count: countPorCurso[slug] ?? 0 })),
  ]

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const qs = (p: number) => {
    const u = new URLSearchParams()
    if (curso) u.set('curso', curso)
    if (status) u.set('status', status)
    if (billing) u.set('billing', billing)
    if (busca) u.set('busca', busca)
    u.set('page', String(p))
    return `?${u.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{total} registro(s)</p>
        </div>
      </div>

      {/* Abas por produto */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--azuris-surface)]">
        {abas.map((aba) => {
          const ativa = curso === aba.slug
          return (
            <Link
              key={aba.slug || 'todos'}
              href={tabHref(aba.slug)}
              className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                ativa
                  ? 'border-[var(--azuris-cyan)] text-[var(--azuris-cyan)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {aba.label}
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${ativa ? 'bg-[var(--azuris-cyan)]/15' : 'bg-[var(--azuris-surface)]'}`}>
                {aba.count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Filtros — aplicam sozinhos (selects na hora, busca com debounce) */}
      <Filtros curso={curso} status={status} billing={billing} busca={busca} />

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-[var(--azuris-surface)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--azuris-deep)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Pgto</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--azuris-surface)]">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--azuris-deep)]/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/vendas/${r.id}`} className="font-medium hover:text-[var(--azuris-cyan)]">
                    {r.nome}
                  </Link>
                  <div className="text-xs text-[var(--text-muted)]">{r.email}</div>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{labelProduto(r.curso_slug)}</td>
                <td className="px-4 py-3">
                  {brl(r.valor_centavos)}
                  {r.installments > 1 && <span className="text-xs text-[var(--text-muted)]"> · {r.installments}x</span>}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{r.billing_type === 'PIX' ? 'PIX' : 'Cartão'}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{fmtData(r.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && !erro && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  Nenhuma venda encontrada com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={qs(page - 1)} className="rounded-lg border border-[var(--azuris-surface)] px-3 py-1.5 hover:border-[var(--azuris-cyan)]/40">
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link href={qs(page + 1)} className="rounded-lg border border-[var(--azuris-surface)] px-3 py-1.5 hover:border-[var(--azuris-cyan)]/40">
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
