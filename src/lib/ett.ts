// English Talk Time — assinatura recorrente (Trilha de Dedicação).
//
// A adesão de R$70 é cobrança única e vive no registry comum ([[produtos]], slug
// 'ett-adesao'), passando pelo checkout genérico. A MENSALIDADE não passa lá: ela
// vira uma subscription no Asaas, que gera um ciclo por mês. Por isso este arquivo
// separado — é a fonte da verdade do preço e do ciclo, lida SEMPRE no servidor.
//
// Cada ciclo cobrado é materializado como uma venda pelo webhook
// (db.materializarCicloAssinatura), com curso_slug = ETT_ASSINATURA_SLUG — é isso
// que joga a linha na aba "ETT Assinatura" do painel, separada das assinaturas
// avulsas criadas à mão no /admin/assinaturas.
import type { AsaasCycle } from '@/lib/asaas'

/** curso_slug/produto_slug da assinatura do ETT (aba própria no admin). */
export const ETT_ASSINATURA_SLUG = 'ett-assinatura'

export type PlanoEttId = 'mensal' | 'anual'

export interface PlanoEtt {
  id: PlanoEttId
  /** rótulo do card no checkout */
  label: string
  cycle: AsaasCycle
  /** o que se paga por ciclo, em centavos */
  valorCentavos: number
  /** unidade exibida ao lado do preço */
  unidade: string
  /** descrição que vai pra fatura do cliente e pro registro da assinatura */
  descricao: string
  /** linha de apoio embaixo do preço */
  nota: string
}

/**
 * Os dois planos anunciados na home do ETT: R$39/mês ou R$390/ano ("dois meses de
 * desconto"). Mudou o preço lá? Muda aqui — o valor do POST vem daqui, nunca do client.
 */
export const PLANOS_ETT: PlanoEtt[] = [
  {
    id: 'mensal',
    label: 'Mensal',
    cycle: 'MONTHLY',
    valorCentavos: 3900,
    unidade: 'por mês',
    descricao: 'ETT — Trilha de Dedicação (mensal)',
    nota: 'Renova todo mês. Cancela quando quiser.',
  },
  {
    id: 'anual',
    label: 'Anual',
    cycle: 'YEARLY',
    valorCentavos: 39000,
    unidade: 'por ano',
    descricao: 'ETT — Trilha de Dedicação (anual)',
    nota: 'Equivale a 10 meses — dois meses de desconto.',
  },
]

/** Plano pelo id vindo do form. Null quando o id não existe (não confiar no client). */
export function getPlanoEtt(id: string | null | undefined): PlanoEtt | null {
  return PLANOS_ETT.find((p) => p.id === id) ?? null
}

/** Economia do anual vs. 12 meses do mensal, em centavos. 0 se não houver os dois. */
export function economiaAnualCentavos(): number {
  const mensal = getPlanoEtt('mensal')
  const anual = getPlanoEtt('anual')
  if (!mensal || !anual) return 0
  return Math.max(0, mensal.valorCentavos * 12 - anual.valorCentavos)
}
