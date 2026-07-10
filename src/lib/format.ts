// Helpers puros de formatação/normalização, compartilhados pelos checkouts e admin.
// (Antes estavam re-declarados em ~6 arquivos.)

/** Piso de valor (R$) pra cobrança — respeita mínimos do Asaas e evita valor quebrado. */
export const VALOR_MINIMO_REAIS = 5

/** Só os dígitos de uma string (remove máscara de CPF/telefone/etc.). */
export function onlyDigits(s: string | null | undefined): string {
  return (s ?? '').replace(/\D/g, '')
}

/** Fuso de referência do negócio — tudo que é "dia" (vencimento, buckets, meta). */
export const TZ_BR = 'America/Sao_Paulo'

/** Hoje em BRT como YYYY-MM-DD (en-CA já entrega nesse formato). */
export function hojeBRT(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ_BR }).format(new Date())
}

/**
 * Data YYYY-MM-DD daqui a N dias, ancorada em BRT (não UTC) — à noite no BRT o UTC
 * já virou o dia seguinte, o que fazia o vencimento pular um dia. Ancorar ao meio-dia
 * UTC do dia BRT evita cruzar a fronteira do dia.
 */
export function todayPlusDays(days: number): string {
  const base = new Date(`${hojeBRT()}T12:00:00Z`)
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}
