import { listarCuponsComUso, type CupomComUso } from '@/lib/cupons'
import { CUPOM_PCT_MAX } from '@/lib/cupom'
import { labelProduto } from '@/lib/admin-queries'
import CuponsManager, { type ProdutoOpcao } from './CuponsManager'

export const dynamic = 'force-dynamic'

// Produtos que aceitam cupom. O caminho é o do checkout — é dele que sai o link
// fixo do parceiro (`?c=CODIGO`).
const PRODUTOS: ProdutoOpcao[] = [
  { slug: 'dss-2026', nome: `${labelProduto('dss-2026')} (FullPass)`, caminho: '/dssbr-2026/inscricao' },
  { slug: 'dss-one-day-2026', nome: labelProduto('dss-one-day-2026'), caminho: '/dssbr-2026/one-day' },
]

export default async function CuponsPage() {
  let cupons: CupomComUso[] = []
  let erro: string | null = null
  try {
    cupons = await listarCuponsComUso()
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro ao consultar o banco.'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cupons de desconto</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Quem pode vender com desconto, e quanto cada um já vendeu. São duas situações diferentes:{' '}
          <strong className="text-[var(--text-primary)]">vendedora</strong> gera o próprio link, um por cliente, e cada
          link morre no prazo; <strong className="text-[var(--text-primary)]">parceiro</strong> recebe de você um link
          fixo pra divulgar. Nos dois casos o desconto sai do preço na hora do checkout, e desligar aqui derruba os
          links na hora — inclusive os que já estão na mão de cliente.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Falha ao carregar: {erro}. Rodou a migration? (POST /api/admin/migrate)
        </div>
      )}

      <CuponsManager cuponsIniciais={cupons} produtos={PRODUTOS} pctMax={CUPOM_PCT_MAX} />
    </div>
  )
}
