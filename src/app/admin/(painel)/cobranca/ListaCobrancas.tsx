import Link from 'next/link'
import { brl, whatsappUrl, tabProduto, STATUS_LABEL, STATUS_COR } from '@/lib/admin-queries'
import { labelBilling } from '@/lib/billing'
import { descricaoManual, mensagemCobranca } from '@/lib/cobranca-manual'
import { dadosClienteTexto } from '@/lib/dados-cliente'
import type { InscricaoRow } from '@/lib/db'
import SyncRowButton from './SyncRowButton'
import CancelarButton from '../vendas/CancelarButton'
import CopiarClienteButton from '../vendas/CopiarClienteButton'
import CopiarMensagemButton from './CopiarMensagemButton'

function descricao(insc: InscricaoRow): string {
  return descricaoManual(insc.como_conheceu) || insc.como_conheceu || '—'
}

/** A mesma mensagem que o form mostra logo depois de gerar — pra quando o navegador fechou antes. */
function mensagem(insc: InscricaoRow): string | null {
  if (!insc.asaas_invoice_url) return null
  return mensagemCobranca({
    nome: insc.nome,
    descricao: descricao(insc),
    valor: insc.valor_centavos / 100,
    billing_type: insc.billing_type,
    installments: insc.installments,
    invoiceUrl: insc.asaas_invoice_url,
  })
}

/** wa.me já com a mensagem, enquanto a cobrança está em aberto; senão só abre a conversa. */
function waComMensagem(insc: InscricaoRow): string | null {
  const wa = whatsappUrl(insc.telefone)
  const msg = mensagem(insc)
  if (!wa || !msg || (insc.status !== 'pending' && insc.status !== 'overdue')) return wa
  return `${wa}${wa.includes('?') ? '&' : '?'}text=${encodeURIComponent(msg)}`
}

function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COR[status] ?? ''}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export default function ListaCobrancas({ rows, total }: { rows: InscricaoRow[]; total: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold">Cobranças geradas</h2>
        <span className="text-sm text-[var(--text-muted)]">{total} no total</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--azuris-surface)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--azuris-deep)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Meio</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Ações</th>
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
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full border border-[var(--azuris-surface)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                    {tabProduto(r.curso_slug)}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{descricao(r)}</td>
                <td className="px-4 py-3">
                  {brl(r.valor_centavos)}
                  {r.installments > 1 && <span className="text-xs text-[var(--text-muted)]"> · {r.installments}x</span>}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{labelBilling(r.billing_type)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{fmtData(r.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {r.asaas_invoice_url && (
                      <a
                        href={r.asaas_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir fatura no Asaas"
                        className="rounded-lg border border-[var(--azuris-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--azuris-cyan)]/40 hover:text-[var(--azuris-cyan)]"
                      >
                        fatura
                      </a>
                    )}
                    {(r.status === 'pending' || r.status === 'overdue') && mensagem(r) && (
                      <CopiarMensagemButton texto={mensagem(r)!} />
                    )}
                    {whatsappUrl(r.telefone) && (
                      <a
                        href={waComMensagem(r) ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={
                          r.status === 'pending' || r.status === 'overdue'
                            ? 'Abrir WhatsApp do cliente com a mensagem e o link de pagamento'
                            : 'Abrir WhatsApp do cliente'
                        }
                        className="rounded-lg border border-[var(--accent-emerald)]/40 px-2.5 py-1 text-xs font-semibold text-[var(--accent-emerald)] transition-colors hover:bg-[var(--accent-emerald)]/10"
                      >
                        wpp
                      </a>
                    )}
                    <Link
                      href={`/admin/cobranca?de=${r.id}`}
                      title="Nova cobrança reaproveitando os dados deste cliente"
                      className="rounded-lg border border-[var(--azuris-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--azuris-cyan)]/40 hover:text-[var(--azuris-cyan)]"
                    >
                      nova cobrança
                    </Link>
                    <SyncRowButton id={r.id} />
                    {/* Renegociar valor/descrição e cancelar só fazem sentido enquanto não pagou. */}
                    {(r.status === 'pending' || r.status === 'overdue') && (
                      <>
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  Nenhuma cobrança gerada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
