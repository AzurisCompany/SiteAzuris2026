import Link from 'next/link'
import { diagnosticoSaude, labelProduto, brl, type DiagnosticoSaude } from '@/lib/admin-queries'
import { reconciliacaoCaixa, labelGrupo, type Reconciliacao } from '@/lib/reconciliacao'
import type { InscricaoRow } from '@/lib/db'
import SyncRowButton from '../cobranca/SyncRowButton'
import SyncAllButton from '../SyncAllButton'

export const dynamic = 'force-dynamic'

/** 'YYYY-MM-DD' → 'DD/MM/AA' sem escorregar de dia por fuso. */
function fmtYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-')
  if (!y || !m || !d) return ymd || '—'
  return `${d}/${m}/${y.slice(2)}`
}

function fmtData(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function fmtDataHora(iso: string | null): string {
  if (!iso) return 'nunca'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/** Cartão de uma categoria de anomalia. Verde quando zerado. */
function Secao({
  titulo,
  descricao,
  total,
  children,
}: {
  titulo: string
  descricao: string
  total: number
  children?: React.ReactNode
}) {
  const ok = total === 0
  return (
    <section className="rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{titulo}</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{descricao}</p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold ${
            ok
              ? 'bg-[var(--accent-emerald)]/12 text-[var(--accent-emerald)]'
              : 'bg-orange-400/12 text-orange-400'
          }`}
        >
          {ok ? '✓ 0' : total}
        </span>
      </div>
      {!ok && <div className="mt-4">{children}</div>}
    </section>
  )
}

function LinhaInscricao({ r, comSync }: { r: InscricaoRow; comSync?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-[var(--azuris-surface)]/40">
      <div className="min-w-0">
        <Link href={`/admin/vendas/${r.id}`} className="font-medium hover:text-[var(--azuris-cyan)]">
          {r.nome}
        </Link>
        <span className="ml-2 text-xs text-[var(--text-muted)]">{labelProduto(r.curso_slug)}</span>
        <div className="text-xs text-[var(--text-muted)]">{r.email}</div>
      </div>
      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <span>{brl(r.valor_centavos)}</span>
        <span>venc. {fmtData(r.due_date)}</span>
        <span>criada {fmtData(r.created_at)}</span>
        {comSync && r.asaas_payment_id && <SyncRowButton id={r.id} />}
      </div>
    </div>
  )
}

/** Um KPI do bloco de reconciliação. */
function KpiRec({ rotulo, valor, sub, destaque }: { rotulo: string; valor: string; sub?: string; destaque?: 'cyan' | 'muted' }) {
  return (
    <div className="rounded-xl border border-[var(--azuris-surface)] bg-[var(--azuris-surface)]/30 p-4">
      <div className="text-xs text-[var(--text-muted)]">{rotulo}</div>
      <div className={`mt-1 text-xl font-bold ${destaque === 'cyan' ? 'text-[var(--azuris-cyan)]' : ''}`}>{valor}</div>
      {sub && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{sub}</div>}
    </div>
  )
}

/** Reconciliação de caixa: saldo REAL do Asaas × líquido recebido do banco.
 *  Chamada externa isolada — se o Asaas falhar, só este bloco mostra erro. */
async function ReconciliacaoBloco() {
  let rec: Reconciliacao | null = null
  let erro: string | null = null
  try {
    rec = await reconciliacaoCaixa(60)
  } catch (e) {
    erro = e instanceof Error ? e.message : 'erro ao consultar o Asaas'
  }

  if (erro) {
    return (
      <section className="rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-5">
        <h2 className="font-bold">Reconciliação de caixa</h2>
        <p className="mt-2 text-sm text-orange-300">
          Não consegui puxar o saldo/extrato do Asaas: {erro}
        </p>
      </section>
    )
  }
  if (!rec) return null

  const dif = rec.diferencaCentavos
  const explicacao =
    dif > 0
      ? 'O Asaas tem mais caixa que a receita reconhecida no banco — típico de antecipação de parcelas futuras de cartão e/ou pagamentos cujo webhook não fechou (ver anomalias abaixo).'
      : dif < 0
        ? 'A receita reconhecida no banco supera o caixa — cartão confirmado ainda não liberado (compensa D+30) e/ou saques já feitos.'
        : 'Saldo e líquido batem exatamente.'

  return (
    <section className="rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Reconciliação de caixa</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Saldo real da conta Asaas × &quot;Líquido recebido&quot; do banco. São métricas diferentes — o extrato abaixo explica a diferença.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <KpiRec rotulo="Saldo disponível no Asaas" valor={brl(rec.saldoAsaasCentavos)} sub="caixa pra saque agora" destaque="cyan" />
        <KpiRec rotulo="Líquido recebido (banco)" valor={brl(rec.liquidoBancoCentavos)} sub={`${rec.pagasBanco} vendas pagas`} />
        <KpiRec
          rotulo="Diferença (saldo − líquido)"
          valor={`${dif >= 0 ? '+' : ''}${brl(dif)}`}
          sub="esperada ≠ 0"
          destaque="muted"
        />
      </div>

      <p className="mt-3 text-xs text-[var(--text-muted)]">{explicacao}</p>

      {rec.gruposExtrato.length > 0 && (
        <div className="mt-5">
          <div className="text-xs font-semibold text-[var(--text-muted)]">
            Extrato das últimas {Math.min(rec.janela, rec.totalTransacoes)} movimentações
            {rec.totalTransacoes > rec.janela && ` (de ${rec.totalTransacoes})`}, por tipo
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rec.gruposExtrato.map((g) => (
              <div
                key={g.grupo}
                className="flex items-center justify-between rounded-lg border border-[var(--azuris-surface)] px-3 py-2 text-sm"
              >
                <span>
                  {labelGrupo(g.grupo)}{' '}
                  <span className="text-xs text-[var(--text-muted)]">({g.qtde})</span>
                </span>
                <span className={`font-semibold ${g.totalCentavos < 0 ? 'text-orange-300' : 'text-[var(--accent-emerald)]'}`}>
                  {g.totalCentavos >= 0 ? '+' : ''}
                  {brl(g.totalCentavos)}
                </span>
              </div>
            ))}
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-[var(--azuris-cyan)]">
              Ver movimentações individuais
            </summary>
            <div className="mt-2 space-y-1">
              {rec.transacoes.slice(0, 25).map((t, i) => (
                <div
                  key={`${t.date}-${i}`}
                  className="flex items-center justify-between gap-3 rounded px-2 py-1.5 text-xs hover:bg-[var(--azuris-surface)]/40"
                >
                  <span className="w-16 shrink-0 text-[var(--text-muted)]">{fmtYmd(t.date)}</span>
                  <span className="min-w-0 flex-1 truncate">{t.description ?? t.type}</span>
                  <span className={`shrink-0 font-medium ${t.value < 0 ? 'text-orange-300' : 'text-[var(--accent-emerald)]'}`}>
                    {t.value >= 0 ? '+' : ''}
                    {brl(Math.round(t.value * 100))}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </section>
  )
}

export default async function SaudePage() {
  let d: DiagnosticoSaude | null = null
  let erro: string | null = null
  try {
    d = await diagnosticoSaude()
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro ao consultar o banco.'
  }

  const totalAnomalias = d
    ? d.pendentesVencidos.total +
      d.semCobranca.total +
      d.pendentesAntigos.total +
      d.possiveisDuplicatas.total +
      d.eventosOrfaos.total
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Saúde &amp; reconciliação</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {d
              ? totalAnomalias === 0
                ? 'Tudo conciliado — nenhuma divergência encontrada.'
                : `${totalAnomalias} item(ns) precisam de atenção.`
              : 'Diagnóstico do que pode estar furando entre o Asaas e o banco.'}
            {d && (
              <>
                {' · '}
                <span>última conciliação automática: {fmtDataHora(d.ultimaConciliacao)}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/conciliacao"
            className="rounded-lg border border-[var(--azuris-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:border-amber-400/40 hover:text-amber-300"
          >
            🔎 Falhas de conciliação
          </Link>
          <Link
            href="/admin/importar"
            className="rounded-lg border border-[var(--azuris-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--azuris-cyan)]/40 hover:text-[var(--azuris-cyan)]"
          >
            ↓ Importar do Asaas
          </Link>
          <SyncAllButton />
        </div>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Falha ao carregar diagnóstico: {erro}
        </div>
      )}

      <ReconciliacaoBloco />

      {d && (
        <div className="grid gap-4">
          <Secao
            titulo="Pendentes já vencidos"
            descricao="Cobrança com vencimento no passado ainda 'pendente' — provável webhook perdido. Sincronize."
            total={d.pendentesVencidos.total}
          >
            <div className="space-y-1">
              {d.pendentesVencidos.rows.map((r) => (
                <LinhaInscricao key={r.id} r={r} comSync />
              ))}
              {d.pendentesVencidos.total > d.pendentesVencidos.rows.length && (
                <p className="px-3 pt-2 text-xs text-[var(--text-muted)]">
                  mostrando {d.pendentesVencidos.rows.length} de {d.pendentesVencidos.total}
                </p>
              )}
            </div>
          </Secao>

          <Secao
            titulo="Pendentes há mais de 7 dias"
            descricao="Cobranças arrastando sem pagamento — candidatas a lembrete ou cancelamento."
            total={d.pendentesAntigos.total}
          >
            <div className="space-y-1">
              {d.pendentesAntigos.rows.map((r) => (
                <LinhaInscricao key={r.id} r={r} comSync />
              ))}
              {d.pendentesAntigos.total > d.pendentesAntigos.rows.length && (
                <p className="px-3 pt-2 text-xs text-[var(--text-muted)]">
                  mostrando {d.pendentesAntigos.rows.length} de {d.pendentesAntigos.total}
                </p>
              )}
            </div>
          </Secao>

          <Secao
            titulo="Sem cobrança gerada"
            descricao="Inscrição registrada mas sem fatura no Asaas (falhou na criação). Lead sem link de pagamento."
            total={d.semCobranca.total}
          >
            <div className="space-y-1">
              {d.semCobranca.rows.map((r) => (
                <LinhaInscricao key={r.id} r={r} />
              ))}
              {d.semCobranca.total > d.semCobranca.rows.length && (
                <p className="px-3 pt-2 text-xs text-[var(--text-muted)]">
                  mostrando {d.semCobranca.rows.length} de {d.semCobranca.total}
                </p>
              )}
            </div>
          </Secao>

          <Secao
            titulo="Possíveis duplicatas"
            descricao="Mesmo documento, produto e valor em 2+ inscrições vivas — pode ser cobrança dobrada."
            total={d.possiveisDuplicatas.total}
          >
            <div className="space-y-1">
              {d.possiveisDuplicatas.rows.map((g) => (
                <Link
                  key={`${g.cpf_cnpj}:${g.curso_slug}:${g.valor_centavos}`}
                  href={`/admin/vendas?busca=${encodeURIComponent(g.cpf_cnpj)}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-[var(--azuris-surface)]/40"
                >
                  <span className="font-mono text-xs">{g.cpf_cnpj}</span>
                  <span className="text-xs text-[var(--text-muted)]">{labelProduto(g.curso_slug)}</span>
                  <span className="text-xs text-[var(--text-muted)]">{brl(g.valor_centavos)}</span>
                  <span className="rounded-full bg-orange-400/12 px-2 py-0.5 text-xs font-semibold text-orange-400">
                    {g.qtde}×
                  </span>
                </Link>
              ))}
            </div>
          </Secao>

          <Secao
            titulo="Eventos órfãos"
            descricao="Webhook do Asaas recebido pra um pagamento que não existe no banco. Investigar."
            total={d.eventosOrfaos.total}
          >
            <div className="space-y-1">
              {d.eventosOrfaos.rows.map((o) => (
                <div
                  key={o.asaas_payment_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs">{o.asaas_payment_id}</span>
                  <span className="text-xs text-[var(--text-muted)]">{o.eventos} evento(s)</span>
                  <span className="text-xs text-[var(--text-muted)]">último {fmtDataHora(o.ultimo)}</span>
                </div>
              ))}
            </div>
          </Secao>
        </div>
      )}
    </div>
  )
}
