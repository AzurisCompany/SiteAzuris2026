// Produtos que aceitam cupom de desconto ([[cupons]]) e onde fica o checkout de cada um.
// Uma lista só pra três lugares: as caixinhas de /admin/cupons, o link fixo do parceiro
// (`<caminho>?c=CODIGO`) e os links que a vendedora gera em /vendas (`<caminho>?d=TOKEN`).
// Produto novo aqui só funciona se a página dele também ler o cupom (PasseCheckout,
// CheckoutPorLotes ou a inscrição do FullPass).
import { PRODUTOS } from '@/lib/produtos'

export interface ProdutoComCupom {
  slug: string
  /** nome curto, pro admin e pra mensagem da vendedora */
  nome: string
  /** caminho do checkout que lê `?c=` e `?d=` */
  caminho: string
}

export const PRODUTOS_COM_CUPOM: ProdutoComCupom[] = [
  { slug: 'dss-vip-2026', nome: 'Ingresso VIP', caminho: '/dssbr-2026/vip' },
  { slug: 'dss-business-2026', nome: 'Ingresso Business', caminho: '/dssbr-2026/business' },
]

export function produtoComCupom(slug: string): ProdutoComCupom | undefined {
  return PRODUTOS_COM_CUPOM.find((p) => p.slug === slug)
}

/** Só slugs conhecidos, sem repetição, na ordem da lista acima. */
export function normalizarProdutos(slugs: unknown): string[] {
  const pedidos = new Set(Array.isArray(slugs) ? slugs.map(String) : [])
  return PRODUTOS_COM_CUPOM.map((p) => p.slug).filter((s) => pedidos.has(s) && PRODUTOS[s])
}
