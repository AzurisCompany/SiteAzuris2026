// Helpers puros de formatação/normalização, compartilhados pelos checkouts e admin.
// (Antes estavam re-declarados em ~6 arquivos.)

/** Piso de valor (R$) pra cobrança — respeita mínimos do Asaas e evita valor quebrado. */
export const VALOR_MINIMO_REAIS = 5

/** Só os dígitos de uma string (remove máscara de CPF/telefone/etc.). */
/** Máscara de telefone BR conforme se digita: (41) 9999-9999 / (41) 99999-9999. */
export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

/** Máscara de CPF conforme se digita: 000.000.000-00. */
export function maskCpf(v: string): string {
  return v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

/** Máscara de CNPJ conforme se digita: 00.000.000/0000-00. */
export function maskCnpj(v: string): string {
  return v
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5')
}

/** Máscara de CEP conforme se digita: 00000-000. */
export function maskCep(v: string): string {
  return v
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2')
}

/**
 * Máscara do documento conforme o tipo de pessoa escolhido no checkout.
 * O tipo decide o formato (e o teto de dígitos) — não o contrário: quem marcou
 * PJ não consegue digitar um CPF de 11 dígitos e passar despercebido.
 */
export function maskDocumento(v: string, tipo: 'PF' | 'PJ'): string {
  return tipo === 'PJ' ? maskCnpj(v) : maskCpf(v)
}

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
