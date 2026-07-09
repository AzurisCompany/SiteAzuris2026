import Link from 'next/link'
import { diagnosticoSaude, labelProduto, brl, type DiagnosticoSaude } from '@/lib/admin-queries'
import type { InscricaoRow } from '@/lib/db'
import SyncRowButton from '../cobranca/SyncRowButton'
import SyncAllButton from '../SyncAllButton'

export const dynamic = 'force-dynamic'

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
        <SyncAllButton />
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Falha ao carregar diagnóstico: {erro}
        </div>
      )}

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
