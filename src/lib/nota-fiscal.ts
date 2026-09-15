// Quem pediu nota fiscal, e quem ainda está esperando a nota.
//
// O checkout NÃO grava um "quero nota" explícito: a caixinha "Preciso de nota fiscal"
// só decide se o endereço aparece e é enviado (ver components/checkout/DadosNota.tsx).
// O pedido fica gravado no que ela deixa pra trás, e é isso que esta regra lê:
//
// - **CNPJ** → pediu. Decisão de 15/07: empresa compra pra ter nota (DSS, Lakehouse e
//   cobrança avulsa exigem o endereço de PJ). Lê os 14 dígitos do documento, e não o
//   `pessoa_tipo`, porque venda anterior a 17/07 com CNPJ gravou `pessoa_tipo` NULL.
// - **Endereço de NF preenchido** → pediu. Pessoa física só manda endereço marcando
//   a caixinha, então endereço gravado = caixinha marcada.
//
// "Emitida" tem duas fontes: a marcação manual da lista (`nf_emitida_em`, pra nota
// emitida fora do sistema, que é como sai hoje) e a nota autorizada pelo Asaas
// (`nf_status`, preenchido pelo botão do detalhe da venda).
//
// A regra existe duas vezes, em TS (badge da linha) e em SQL (filtro e contagem).
// O teste nota-fiscal.test.ts confere que as duas concordam.

import { onlyDigits } from '@/lib/format'

export type SituacaoNota = 'nao_pediu' | 'aguardando_pagamento' | 'a_emitir' | 'emitida'

/** Valores do filtro `?nf=` em /admin/vendas. */
export const FILTROS_NOTA = ['pediu', 'a_emitir', 'emitida', 'nao_pediu'] as const
export type FiltroNota = (typeof FILTROS_NOTA)[number]

export function isFiltroNota(v: string | null | undefined): v is FiltroNota {
  return FILTROS_NOTA.includes(v as FiltroNota)
}

export interface LinhaNota {
  cpf_cnpj: string | null
  pessoa_tipo: 'PF' | 'PJ' | null
  nf_endereco: Record<string, string> | null
  status: string
  valor_centavos: number
  nf_status: string | null
  /** opcional: não existe antes da migração */
  nf_emitida_em?: string | null
}

/** Por que a venda conta como "pediu nota" — pro tooltip. null = não pediu. */
export function motivoPedidoNota(r: LinhaNota): 'cnpj' | 'endereco' | null {
  if (onlyDigits(r.cpf_cnpj).length === 14 || r.pessoa_tipo === 'PJ') return 'cnpj'
  if (r.nf_endereco && Object.values(r.nf_endereco).some((v) => typeof v === 'string' && v.trim())) {
    return 'endereco'
  }
  return null
}

export function pediuNota(r: LinhaNota): boolean {
  return motivoPedidoNota(r) !== null
}

export function notaEmitida(r: LinhaNota): boolean {
  return Boolean(r.nf_emitida_em) || r.nf_status === 'AUTHORIZED'
}

/**
 * Situação da nota na venda. Emitida vence tudo (inclusive venda estornada depois:
 * é o aviso pra cancelar a nota). Venda gratuita não entra em "a emitir": nota de R$ 0
 * não existe.
 */
export function situacaoNota(r: LinhaNota): SituacaoNota {
  if (notaEmitida(r)) return 'emitida'
  if (!pediuNota(r)) return 'nao_pediu'
  if (r.status === 'paid' && r.valor_centavos > 0) return 'a_emitir'
  return 'aguardando_pagamento'
}

// --- Espelho SQL (mesma regra, pro WHERE de /admin/vendas) ---

const SQL_PEDIU = `(length(regexp_replace(COALESCE(cpf_cnpj, ''), '[^0-9]', '', 'g')) = 14
  OR COALESCE(pessoa_tipo, '') = 'PJ'
  OR (nf_endereco IS NOT NULL AND nf_endereco <> '{}'::jsonb))`

// Tudo com COALESCE: NULL num OR vira NULL, e o `NOT` do "não pediu" sumiria com a linha.
// Depende da coluna nf_emitida_em: só é usado quando o filtro de nota está ativo,
// e a contagem do cabeçalho engole o erro antes da migração.
const SQL_EMITIDA = `(nf_emitida_em IS NOT NULL OR COALESCE(nf_status, '') = 'AUTHORIZED')`

export const SQL_NOTA: Record<FiltroNota, string> = {
  pediu: SQL_PEDIU,
  emitida: SQL_EMITIDA,
  a_emitir: `(${SQL_PEDIU} AND status = 'paid' AND valor_centavos > 0 AND NOT ${SQL_EMITIDA})`,
  nao_pediu: `(NOT ${SQL_PEDIU} AND NOT ${SQL_EMITIDA})`,
}

export const LABEL_FILTRO_NOTA: Record<FiltroNota, string> = {
  pediu: 'Pediu nota fiscal',
  a_emitir: 'NF a emitir',
  emitida: 'NF emitida',
  nao_pediu: 'Não pediu nota',
}
