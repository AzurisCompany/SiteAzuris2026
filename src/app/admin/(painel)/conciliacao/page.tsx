import Link from 'next/link'
import { diagnosticarConciliacao, type FalhaConciliacao } from '@/lib/asaas-sync'
import { brl } from '@/lib/admin-queries'
import TesteButton from '../vendas/TesteButton'

export const dynamic = 'force-dynamic'

function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function LinhaFalha({ f }: { f: FalhaConciliacao }) {
  const suspeitaTeste = f.tipo === 'nao_existe_no_asaas'
  return (
    <div className="rounded-lg border border-[var(--azuris-surface)] px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/vendas/${f.id}`} className="font-medium hover:text-[var(--azuris-cyan)]">
            {f.nome || '— sem nome'}
          </Link>
          <span className="ml-2 text-xs text-[var(--text-muted)]">{f.email}</span>
          <div className="mt-0.5 text-xs text-[var(--text-muted)]">
            {brl(f.valor_centavos)} · status {f.status} · criada {fmtData(f.created_at)} · fatura{' '}
            <span className="font-mono">{f.asaas_payment_id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              suspeitaTeste ? 'bg-amber-400/12 text-amber-300' : 'bg-red-500/12 text-red-300'
            }`}
          >
            {suspeitaTeste ? 'não existe no Asaas' : 'erro'}
          </span>
          <TesteButton id={f.id} isTeste={f.is_teste} />
        </div>
      </div>
      <div className="mt-2 overflow-x-auto rounded bg-[var(--azuris-surface)]/40 px-3 py-1.5">
        <code className="whitespace-pre-wrap break-words text-xs text-[var(--text-muted)]">{f.erro}</code>
      </div>
    </div>
  )
}

export default async function ConciliacaoPage() {
  let d: Awaited<ReturnType<typeof diagnosticarConciliacao>> | null = null
  let erro: string | null = null
  try {
    d = await diagnosticarConciliacao()
  } catch (e) {
    erro = e instanceof Error ? e.message : 'erro ao diagnosticar'
  }

  const suspeitasTeste = d?.falhas.filter((f) => f.tipo === 'nao_existe_no_asaas').length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Link href="/admin/saude" className="hover:text-[var(--azuris-cyan)]">
            ← Saúde &amp; reconciliação
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-bold">Falhas de conciliação</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Dry-run: para cada cobrança não-final, tenta buscar no Asaas e mostra as que falham + o motivo.
          É o &quot;porquê&quot; por trás do <span className="font-mono text-xs">erros: N</span> do cron. Nada é
          escrito aqui.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Falha ao diagnosticar: {erro}
        </div>
      )}

      {d && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
            <span className="rounded-full bg-[var(--azuris-surface)] px-3 py-1">{d.total} não-finais verificadas</span>
            <span className="text-[var(--accent-emerald)]">{d.ok} ok</span>
            <span className={d.falhas.length ? 'text-orange-400' : ''}>{d.falhas.length} falha(s)</span>
            {suspeitasTeste > 0 && (
              <span className="text-amber-300">{suspeitasTeste} provável(is) teste/sandbox</span>
            )}
          </div>

          {d.falhas.length === 0 ? (
            <div className="rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6 text-center text-sm text-[var(--accent-emerald)]">
              ✓ Nenhuma falha — tudo concilia com o Asaas.
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-[var(--text-muted)]">
                <strong className="text-amber-300">&quot;Não existe no Asaas&quot;</strong> = o
                <span className="font-mono"> asaas_payment_id</span> não retorna na conta de produção — quase sempre
                linha de teste/sandbox. <strong>Marque como teste</strong> pra tirar dos KPIs e do cron (não apaga).
                Se for uma venda real que sumiu, investigue no detalhe.
              </div>
              <div className="space-y-2">
                {d.falhas.map((f) => (
                  <LinhaFalha key={f.id} f={f} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
