import Link from 'next/link'
import { brl, whatsappUrl } from '@/lib/admin-queries'
import { labelBilling } from '@/lib/billing'
import type { AssinaturaRow } from '@/lib/db'
import CancelarAssinaturaButton from './CancelarAssinaturaButton'

const CICLO_LABEL: Record<string, string> = {
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUALLY: 'Semestral',
  YEARLY: 'Anual',
}

function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function ListaAssinaturas({ rows }: { rows: AssinaturaRow[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">Assinaturas ({rows.length})</h2>
      <div className="overflow-x-auto rounded-xl border border-[var(--azuris-surface)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--azuris-deep)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Ciclo</th>
              <th className="px-4 py-3">Meio</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Criada</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--azuris-surface)]">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-[var(--azuris-deep)]/50">
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {a.nome}
                    {a.is_teste && (
                      <span className="ml-2 inline-flex rounded-full bg-amber-400/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                        teste
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{a.email}</div>
                  {a.telefone && whatsappUrl(a.telefone) && (
                    <a href={whatsappUrl(a.telefone) ?? undefined} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent-emerald)] hover:underline">
                      {a.telefone}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{a.descricao ?? '—'}</td>
                <td className="px-4 py-3">{brl(a.valor_centavos)}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{CICLO_LABEL[a.cycle] ?? a.cycle}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{labelBilling(a.billing_type)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      a.status === 'active'
                        ? 'bg-[var(--accent-emerald)]/12 text-[var(--accent-emerald)]'
                        : 'bg-[var(--text-muted)]/12 text-[var(--text-muted)]'
                    }`}
                  >
                    {a.status === 'active' ? 'Ativa' : 'Cancelada'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{fmtData(a.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  {a.status === 'active' ? (
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/vendas?curso=assinatura&busca=${encodeURIComponent(a.cpf_cnpj)}`} className="text-xs text-[var(--azuris-cyan)] hover:underline">
                        ciclos
                      </Link>
                      <CancelarAssinaturaButton id={a.id} />
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  Nenhuma assinatura criada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
