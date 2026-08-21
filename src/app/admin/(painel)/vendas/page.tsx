import Link from 'next/link'
import {
  listarVendas,
  emailsPorProduto,
  contarPorOrigem,
  resumoFinanceiro,
  contarTestes,
  opcoesFiltro,
  totaisVendas,
  labelProduto,
  tabProduto,
  brl,
  whatsappUrl,
  PRODUTO_LABEL,
  STATUS_LABEL,
  STATUS_COR,
  type ResumoProduto,
  type TotaisVendas,
} from '@/lib/admin-queries'
import { labelBilling } from '@/lib/billing'
import { TIPOS_CUPOM, LABEL_TIPO_CUPOM } from '@/lib/cupons'
import { dadosClienteTexto } from '@/lib/dados-cliente'
import type { InscricaoRow } from '@/lib/db'
import Filtros from './Filtros'
import TesteButton from './TesteButton'
import CancelarButton from './CancelarButton'
import CopiarEmailsButton from './CopiarEmailsButton'
import CopiarClienteButton from './CopiarClienteButton'
import BaixarCsvLink from './BaixarCsvLink'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COR[status] ?? ''}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

/** Σ da coluna: soma o filtro INTEIRO, não a página. */
function SomaColuna({ centavos }: { centavos: number | undefined }) {
  if (centavos == null) return null
  return (
    <div className="mt-1 whitespace-nowrap text-sm font-bold normal-case tracking-normal text-[var(--azuris-cyan)]">
      Σ {brl(centavos)}
    </div>
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
  const tipo = sp.tipo || ''
  const pessoa = sp.pessoa || ''
  const origem = sp.origem || ''
  const de = sp.de || ''
  const ate = sp.ate || ''
  const busca = sp.busca || ''
  const mostrarTeste = sp.teste === '1'
  const page = Math.max(Number(sp.page ?? '1') || 1, 1)

  let rows: InscricaoRow[] = []
  let total = 0
  let erro: string | null = null
  let resumo: ResumoProduto[] = []
  let qtdeTestes = 0
  let opcoes: { tipos: string[]; origens: string[] } = { tipos: [], origens: [] }
  let emailsTodos: string[] = []
  let emailsPorCurso: Record<string, string[]> = {}
  let totais: TotaisVendas | null = null
  let porOrigem: Record<string, number> = {}
  const filtros = { curso, status, billing, tipo, pessoa, origem, de, ate, busca, mostrarTeste }
  try {
    const [res, r, qt, op, em, tot, orig] = await Promise.all([
      listarVendas({
        ...filtros,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
      resumoFinanceiro(),
      contarTestes(),
      opcoesFiltro(),
      emailsPorProduto(filtros),
      totaisVendas(filtros),
      contarPorOrigem(filtros),
    ])
    rows = res.rows
    total = res.total
    resumo = r
    qtdeTestes = qt
    opcoes = op
    emailsTodos = em.todos
    emailsPorCurso = em.porCurso
    totais = tot
    porOrigem = orig
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
  // Base com todos os filtros ativos (sem curso/teste/page — esses variam por link).
  // `semOrigem` serve às abas de origem, que são justamente quem troca esse filtro.
  const baseParams = (opts?: { semOrigem?: boolean }) => {
    const u = new URLSearchParams()
    if (status) u.set('status', status)
    if (billing) u.set('billing', billing)
    if (tipo) u.set('tipo', tipo)
    if (pessoa) u.set('pessoa', pessoa)
    if (origem && !opts?.semOrigem) u.set('origem', origem)
    if (de) u.set('de', de)
    if (ate) u.set('ate', ate)
    if (busca) u.set('busca', busca)
    return u
  }

  // Link de aba preservando os outros filtros, resetando página
  const tabHref = (slug: string) => {
    const u = baseParams()
    if (slug) u.set('curso', slug)
    if (mostrarTeste) u.set('teste', '1')
    const s = u.toString()
    return s ? `?${s}` : '/admin/vendas'
  }
  // CSV de contatos: mesma rota, mesmos filtros da tela, um arquivo por produto.
  const exportHref = (slug: string) => {
    const u = baseParams()
    if (slug) u.set('curso', slug)
    if (mostrarTeste) u.set('teste', '1')
    const s = u.toString()
    return `/api/admin/exportar${s ? `?${s}` : ''}`
  }

  const abas = [
    { slug: '', label: 'Todos', count: countTodos, emails: emailsTodos },
    ...Object.keys(PRODUTO_LABEL).map((slug) => ({
      slug,
      label: tabProduto(slug),
      count: countPorCurso[slug] ?? 0,
      emails: emailsPorCurso[slug] ?? [],
    })),
  ]
  // Emails da aba ativa, pro botão do cabeçalho.
  const emailsAtivos = curso ? emailsPorCurso[curso] ?? [] : emailsTodos

  // Abas de origem: quem vendeu pelo link com desconto (`/vendas`) e pelos cupons
  // de parceiro. O `utm_source` da venda é o TIPO do cupom — ver [[cupons]].
  const abasOrigem = [
    { valor: '', label: 'Todas as origens', count: null as number | null },
    ...TIPOS_CUPOM.map((t) => ({ valor: t as string, label: LABEL_TIPO_CUPOM[t], count: porOrigem[t] ?? 0 })),
  ]
  const origemHref = (valor: string) => {
    const u = baseParams({ semOrigem: true })
    if (curso) u.set('curso', curso)
    if (valor) u.set('origem', valor)
    if (mostrarTeste) u.set('teste', '1')
    const s = u.toString()
    return s ? `?${s}` : '/admin/vendas'
  }
  /** Nas abas de cupom, o código é a informação que falta na tabela: quem vendeu. */
  const mostrarCupom = TIPOS_CUPOM.includes(origem as (typeof TIPOS_CUPOM)[number])

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const qs = (p: number) => {
    const u = baseParams()
    if (curso) u.set('curso', curso)
    if (mostrarTeste) u.set('teste', '1')
    u.set('page', String(p))
    return `?${u.toString()}`
  }

  // Link do toggle "ver testes" preservando os filtros atuais
  const toggleTesteHref = (() => {
    const u = baseParams()
    if (curso) u.set('curso', curso)
    if (!mostrarTeste) u.set('teste', '1')
    const s = u.toString()
    return s ? `?${s}` : '/admin/vendas'
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {total} registro(s) · Σ soma o filtro inteiro, não só esta página
            {totais && totais.linhas_sincronizadas < totais.linhas && (
              // Sem isso o Σ do líquido mente calado: SUM ignora NULL, e líquido/taxa
              // só existem depois do sync com o Asaas.
              <>
                {' · '}
                <span className="text-amber-300">
                  líquido/taxa cobrem {totais.linhas_sincronizadas} de {totais.linhas} (o resto não sincronizou)
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
        <CopiarEmailsButton emails={emailsAtivos} />
        <BaixarCsvLink
          href={exportHref(curso)}
          titulo={curso ? tabProduto(curso) : 'todos os produtos'}
          vazio={emailsAtivos.length === 0}
        />
        <Link
          href={toggleTesteHref}
          className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
            mostrarTeste
              ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
              : 'border-[var(--azuris-surface)] text-[var(--text-muted)] hover:border-amber-400/40 hover:text-amber-300'
          }`}
        >
          {mostrarTeste ? '← esconder testes' : `ver testes (${qtdeTestes})`}
        </Link>
        </div>
      </div>

      {/* Abas por produto */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--azuris-surface)]">
        {abas.map((aba) => {
          const ativa = curso === aba.slug
          return (
            <div
              key={aba.slug || 'todos'}
              className={`-mb-px flex items-center gap-1 border-b-2 pr-2 ${
                ativa ? 'border-[var(--azuris-cyan)]' : 'border-transparent'
              }`}
            >
              <Link
                href={tabHref(aba.slug)}
                className={`rounded-t-lg py-2 pl-4 text-sm font-semibold transition-colors ${
                  ativa ? 'text-[var(--azuris-cyan)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {aba.label}
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${ativa ? 'bg-[var(--azuris-cyan)]/15' : 'bg-[var(--azuris-surface)]'}`}>
                  {aba.count}
                </span>
              </Link>
              <CopiarEmailsButton emails={aba.emails} variant="icon" titulo={`${aba.label} — ${aba.emails.length} email(s)`} />
              <BaixarCsvLink
                href={exportHref(aba.slug)}
                variant="icon"
                titulo={`${aba.label} — ${aba.emails.length} contato(s)`}
                vazio={aba.emails.length === 0}
              />
            </div>
          )
        })}
      </div>

      {/* Abas de origem — cruzam com a aba de produto acima (as duas valem juntas) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Origem</span>
        {abasOrigem.map((o) => {
          const ativa = origem === o.valor
          return (
            <Link
              key={o.valor || 'todas'}
              href={origemHref(o.valor)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                ativa
                  ? 'border-[var(--accent-emerald)]/50 bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]'
                  : 'border-[var(--azuris-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {o.label}
              {o.count != null && (
                <span className="ml-2 rounded-full bg-[var(--azuris-surface)]/60 px-1.5 py-0.5 text-xs">{o.count}</span>
              )}
            </Link>
          )
        })}
        {mostrarCupom && (
          <span className="text-xs text-[var(--text-muted)]">
            · o código do cupom diz quem vendeu — a régua de cada um está em{' '}
            <Link href="/admin/cupons" className="text-[var(--azuris-cyan)] hover:underline">
              Cupons
            </Link>
          </span>
        )}
      </div>

      {/* Filtros — aplicam sozinhos (selects na hora, busca com debounce) */}
      <Filtros
        curso={curso}
        status={status}
        billing={billing}
        tipo={tipo}
        pessoa={pessoa}
        origem={origem}
        de={de}
        ate={ate}
        busca={busca}
        tipos={opcoes.tipos}
        origens={opcoes.origens}
      />

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-[var(--azuris-surface)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--azuris-deep)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 align-top">Cliente</th>
              <th className="px-4 py-3 align-top">Produto</th>
              {mostrarCupom && <th className="px-4 py-3 align-top">Cupom</th>}
              <th className="px-4 py-3 align-top">
                Valor
                <SomaColuna centavos={totais?.valor_centavos} />
              </th>
              <th className="px-4 py-3 align-top">
                Líquido
                <SomaColuna centavos={totais?.liquido_centavos} />
              </th>
              <th className="px-4 py-3 align-top">
                Taxa
                <SomaColuna centavos={totais?.taxa_centavos} />
              </th>
              <th className="px-4 py-3 align-top">Pgto</th>
              <th className="px-4 py-3 align-top">Status</th>
              <th className="px-4 py-3 align-top">Data</th>
              <th className="px-4 py-3 align-top text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--azuris-surface)]">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--azuris-deep)]/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/vendas/${r.id}`} className="font-medium hover:text-[var(--azuris-cyan)]">
                    {r.nome}
                  </Link>
                  <CopiarClienteButton nome={r.nome} texto={dadosClienteTexto(r)} />
                  {r.is_teste && (
                    <span className="ml-2 inline-flex rounded-full bg-amber-400/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                      teste
                    </span>
                  )}
                  <div className="text-xs text-[var(--text-muted)]">{r.email}</div>
                  {r.telefone && (
                    <a
                      href={whatsappUrl(r.telefone) ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--accent-emerald)] hover:underline"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-3" aria-hidden="true">
                        <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                      {r.telefone}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {labelProduto(r.curso_slug)}
                  {r.tipo_ingresso && <div className="text-xs text-[var(--text-muted)]">{r.tipo_ingresso}</div>}
                </td>
                {mostrarCupom && (
                  <td className="px-4 py-3">
                    {r.utm_content ? (
                      <code className="text-xs font-semibold uppercase text-[var(--accent-emerald)]">
                        {r.utm_content}
                      </code>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  {brl(r.valor_centavos)}
                  {r.installments > 1 && <span className="text-xs text-[var(--text-muted)]"> · {r.installments}x</span>}
                </td>
                {/* Líquido e taxa só existem depois do sync com o Asaas. */}
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {r.valor_liquido_centavos == null ? (
                    <span className="text-[var(--text-muted)]">—</span>
                  ) : (
                    brl(r.valor_liquido_centavos)
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {r.taxa_centavos == null ? <span className="text-[var(--text-muted)]">—</span> : brl(r.taxa_centavos)}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{labelBilling(r.billing_type)}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{fmtData(r.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex flex-wrap justify-end gap-1.5">
                    <Link
                      href={`/admin/cobranca?de=${r.id}`}
                      title="Nova cobrança reaproveitando os dados deste cliente"
                      className="rounded-lg border border-[var(--azuris-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--azuris-cyan)]/40 hover:text-[var(--azuris-cyan)]"
                    >
                      nova cobrança
                    </Link>
                    <TesteButton id={r.id} isTeste={r.is_teste} />
                    {(r.status === 'pending' || r.status === 'overdue') && (
                      <>
                        {/* Regerar é formulário (valor/meio/parcelas/descrição) — mora no detalhe. */}
                        <Link
                          href={`/admin/vendas/${r.id}#regerar`}
                          title="Cancelar esta e gerar outra com valor/descrição novos"
                          className="rounded-lg border border-[var(--azuris-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--azuris-cyan)]/40 hover:text-[var(--azuris-cyan)]"
                        >
                          regerar
                        </Link>
                        <CancelarButton id={r.id} nome={r.nome} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !erro && (
              <tr>
                <td colSpan={mostrarCupom ? 10 : 9} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  {mostrarCupom
                    ? `Nenhuma venda ${origem === 'parceiro' ? 'por cupom de parceiro' : 'por link de vendedora'} ainda — a aba acende sozinha na primeira.`
                    : 'Nenhuma venda encontrada com esses filtros.'}
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
