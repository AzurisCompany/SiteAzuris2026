import Link from 'next/link'
import { cobrancasForaDoBanco, type CobrancaFora } from '@/lib/importar-asaas'
import { brl } from '@/lib/admin-queries'
import ImportarButton from './ImportarButton'

export const dynamic = 'force-dynamic'

function fmtYmd(ymd: string | null): string {
  if (!ymd) return '—'
  const [y, m, d] = ymd.split('-')
  if (!y || !m || !d) return ymd
  return `${d}/${m}/${y.slice(2)}`
}

const STATUS_BADGE: Record<string, { txt: string; cls: string }> = {
  paid: { txt: 'pago', cls: 'bg-[var(--accent-emerald)]/12 text-[var(--accent-emerald)]' },
  pending: { txt: 'pendente', cls: 'bg-orange-400/12 text-orange-400' },
  overdue: { txt: 'vencido', cls: 'bg-red-500/12 text-red-300' },
  cancelled: { txt: 'cancelado', cls: 'bg-[var(--azuris-surface)] text-[var(--text-muted)]' },
  refunded: { txt: 'estornado', cls: 'bg-red-500/12 text-red-300' },
}

const BILLING_LABEL: Record<string, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão',
  BOLETO: 'Boleto',
  UNDEFINED: 'A escolher',
}

function Linha({ c }: { c: CobrancaFora }) {
  const badge = STATUS_BADGE[c.statusNorm] ?? { txt: c.status, cls: 'bg-[var(--azuris-surface)] text-[var(--text-muted)]' }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--azuris-surface)] px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{c.clienteNome ?? '— sem cliente'}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.txt}</span>
          {c.installment && (
            <span className="rounded-full bg-[var(--azuris-surface)] px-2 py-0.5 text-xs text-[var(--text-muted)]">parcelado</span>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
          {c.descricao ?? 'sem descrição'}
        </div>
        <div className="mt-0.5 text-xs text-[var(--text-muted)]">
          {c.clienteEmail ?? ''}
          {c.clienteDoc ? ` · ${c.clienteDoc}` : ''}
          {` · fatura ${c.id}`}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-semibold">{brl(c.valorCentavos)}</div>
          <div className="text-xs text-[var(--text-muted)]">
            {BILLING_LABEL[c.billingType] ?? c.billingType} · venc. {fmtYmd(c.dueDate)}
          </div>
        </div>
        <ImportarButton asaasPaymentId={c.id} />
      </div>
    </div>
  )
}

export default async function ImportarPage() {
  let dados: Awaited<ReturnType<typeof cobrancasForaDoBanco>> | null = null
  let erro: string | null = null
  try {
    dados = await cobrancasForaDoBanco()
  } catch (e) {
    erro = e instanceof Error ? e.message : 'erro ao consultar o Asaas'
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Link href="/admin/saude" className="hover:text-[var(--azuris-cyan)]">
            ← Saúde &amp; reconciliação
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-bold">Importar cobranças do Asaas</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Cobranças que existem no Asaas mas não no nosso banco — normalmente criadas direto no painel.
          Importa cada uma como venda avulsa (bucket <span className="font-mono text-xs">avulso-asaas</span>),
          já com status, valor e líquido reais. Idempotente: reimportar não duplica.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Não consegui puxar as cobranças do Asaas: {erro}
        </div>
      )}

      {dados && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
            <span className="rounded-full bg-[var(--azuris-surface)] px-3 py-1">
              {dados.total} fora do banco
            </span>
            <span>{dados.escaneadas} cobranças escaneadas no Asaas</span>
            {dados.truncado && (
              <span className="text-orange-400">⚠️ escaneamento truncado — pode haver mais além das primeiras páginas</span>
            )}
            {dados.total > dados.itens.length && (
              <span>mostrando as {dados.itens.length} primeiras</span>
            )}
          </div>

          {dados.itens.length === 0 ? (
            <div className="rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6 text-center text-sm text-[var(--accent-emerald)]">
              ✓ Tudo mapeado — nenhuma cobrança do Asaas fora do banco.
            </div>
          ) : (
            <div className="space-y-2">
              {dados.itens.map((c) => (
                <Linha key={c.id} c={c} />
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--text-muted)]">
            ⚠️ Parceladas no cartão aparecem como uma linha por parcela (é assim que o Asaas as representa).
            Importe as que quiser reconhecer como receita. Para evitar isso no futuro, crie cobranças avulsas
            pelo <Link href="/admin/cobranca" className="text-[var(--azuris-cyan)] hover:underline">/admin/cobranca</Link>{' '}
            em vez do painel do Asaas.
          </p>
        </>
      )}
    </div>
  )
}
