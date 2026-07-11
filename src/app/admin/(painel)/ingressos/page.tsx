import { listarTipos, type TipoIngresso } from '@/lib/tipos-ingresso'
import { labelProduto } from '@/lib/admin-queries'
import IngressosManager from './IngressosManager'

export const dynamic = 'force-dynamic'

// Produtos cujo checkout consome o catálogo de tipos.
const PRODUTOS_COM_TIPOS: Array<{ slug: string; nome: string }> = [
  { slug: 'dss-2026', nome: labelProduto('dss-2026') },
  { slug: 'gubigdata-2026-07', nome: labelProduto('gubigdata-2026-07') },
]

export default async function IngressosPage() {
  let tipos: TipoIngresso[] = []
  let erro: string | null = null
  try {
    tipos = await listarTipos()
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro ao consultar o banco.'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tipos de ingresso</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Cadastre as variantes de um produto (ex.: Estudante, Profissional, VIP, Gratuito). Os checkouts (DSSBR, GU BigData)
          mostram os tipos <strong>ativos</strong> e cobram o valor que você definir aqui. Preço R$ 0,00 = ingresso gratuito
          (só cadastra, sem cobrança). Sem nenhum tipo, o checkout usa o preço único padrão.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Falha ao carregar: {erro}. Rodou a migration? (POST /api/admin/migrate)
        </div>
      )}

      <IngressosManager tiposIniciais={tipos} produtos={PRODUTOS_COM_TIPOS} />
    </div>
  )
}
