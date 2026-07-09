// Rótulos e opções de forma de pagamento. Módulo PURO (só tipos) — pode ser
// importado tanto por componentes de servidor quanto de cliente sem puxar o db.
import type { BillingType } from './db'

export const BILLING_LABEL: Record<BillingType, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão',
  BOLETO: 'Boleto',
  UNDEFINED: 'Cliente escolhe',
}

/** Rótulo amigável de uma forma de pagamento (tolerante a valor cru do banco). */
export function labelBilling(bt: string | null | undefined): string {
  if (!bt) return '—'
  return (BILLING_LABEL as Record<string, string>)[bt] ?? bt
}

/** Opções pro select de filtro (par [valor, rótulo]). */
export const BILLING_OPCOES: ReadonlyArray<readonly [string, string]> = [
  ['', 'Todos os meios'],
  ['PIX', 'PIX'],
  ['CREDIT_CARD', 'Cartão'],
  ['BOLETO', 'Boleto'],
  ['UNDEFINED', 'Cliente escolhe'],
]
