// Helpers puros de formatação/normalização, compartilhados pelos checkouts e admin.
// (Antes estavam re-declarados em ~6 arquivos.)

/** Piso de valor (R$) pra cobrança — respeita mínimos do Asaas e evita valor quebrado. */
export const VALOR_MINIMO_REAIS = 5

/** Só os dígitos de uma string (remove máscara de CPF/telefone/etc.). */
export function onlyDigits(s: string | null | undefined): string {
  return (s ?? '').replace(/\D/g, '')
}

/** Data YYYY-MM-DD daqui a N dias (UTC). Usado pra vencimento de cobrança. */
export function todayPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
