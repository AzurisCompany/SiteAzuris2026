import { listarVendas } from '@/lib/admin-queries'
import type { InscricaoRow } from '@/lib/db'
import CobrancaForm from './CobrancaForm'
import ListaCobrancas from './ListaCobrancas'

export const dynamic = 'force-dynamic'

/** Slug interno das cobranças avulsas (espelha PROPOSTA_SLUG da rota). */
const PROPOSTA_SLUG = 'proposta'

export default async function CobrancaPage() {
  let rows: InscricaoRow[] = []
  let total = 0
  let erro: string | null = null
  try {
    const res = await listarVendas({ curso: PROPOSTA_SLUG, limit: 30 })
    rows = res.rows
    total = res.total
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro ao consultar o banco.'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Cobrança avulsa</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Gera um link de pagamento pra uma proposta fechada — valor e descrição livres. Marque um ou vários meios de
          pagamento. A cobrança entra na lista abaixo e o status fecha sozinho quando o cliente paga.
        </p>
      </div>

      <CobrancaForm />

      {erro ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>
      ) : (
        <ListaCobrancas rows={rows} total={total} />
      )}
    </div>
  )
}
