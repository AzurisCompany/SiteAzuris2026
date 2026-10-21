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

// VIP, o último ingresso do DSS com cupom, encerrou em 21/10/2026: lista vazia. Cupom
// novo é recusado na API ("Marca ao menos um tipo de ingresso") e o link da vendedora
// responde que as vendas encerraram.
export const PRODUTOS_COM_CUPOM: ProdutoComCupom[] = []

export function produtoComCupom(slug: string): ProdutoComCupom | undefined {
  return PRODUTOS_COM_CUPOM.find((p) => p.slug === slug)
}

/** Só slugs conhecidos, sem repetição, na ordem da lista acima. */
export function normalizarProdutos(slugs: unknown): string[] {
  const pedidos = new Set(Array.isArray(slugs) ? slugs.map(String) : [])
  return PRODUTOS_COM_CUPOM.map((p) => p.slug).filter((s) => pedidos.has(s) && PRODUTOS[s])
}
