import { headers } from 'next/headers'
import { listarCuponsComUso, type CupomComUso } from '@/lib/cupons'
import { CUPOM_PCT_MAX } from '@/lib/cupom'
import { PRODUTOS_COM_CUPOM } from '@/lib/cupom-produtos'
import CuponsManager from './CuponsManager'

export const dynamic = 'force-dynamic'

export default async function CuponsPage() {
  // Domínio do link do parceiro, lido no servidor: `window` não existe na renderização
  // do servidor (derrubava a página com 500). Em preview sai o domínio do preview.
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'azuris.com.br'
  const origem = `${h.get('x-forwarded-proto') ?? 'https'}://${host}`

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

      <CuponsManager cuponsIniciais={cupons} produtos={PRODUTOS_COM_CUPOM} origem={origem} pctMax={CUPOM_PCT_MAX} />
    </div>
  )
}
