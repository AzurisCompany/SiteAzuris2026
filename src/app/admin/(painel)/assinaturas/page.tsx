import { listarAssinaturas, type AssinaturaRow } from '@/lib/db'
import AssinaturaForm from './AssinaturaForm'
import ListaAssinaturas from './ListaAssinaturas'

export const dynamic = 'force-dynamic'

export default async function AssinaturasPage() {
  let rows: AssinaturaRow[] = []
  let erro: string | null = null
  try {
    rows = await listarAssinaturas()
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro ao consultar o banco.'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Assinaturas</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Cobrança recorrente via Asaas. Cada ciclo cobrado aparece em Vendas/Financeiro como uma venda de
          &ldquo;Assinatura&rdquo;. Cartão não entra na recorrência (sem tokenização) — use PIX, boleto ou &ldquo;cliente escolhe&rdquo;.
        </p>
      </div>

      <AssinaturaForm />

      {erro ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>
      ) : (
        <ListaAssinaturas rows={rows} />
      )}
    </div>
  )
}
