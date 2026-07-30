// Monta o CSV de contatos da lista de vendas — nome, email, telefone e o contexto
// comercial de cada pessoa, um arquivo por produto.
//
// É a versão "completa" do botão "Copiar emails": aquele devolve só os endereços,
// este devolve a linha inteira pra abrir no Excel/Sheets e trabalhar a lista.
//
// Puro de propósito (sem banco, sem Request): quem busca as linhas é
// [[vendasParaExport]] em admin-queries; quem serve o arquivo é a rota
// /api/admin/exportar. Aqui só tem transformação, e por isso dá pra testar.

import type { InscricaoRow } from '@/lib/db'
import { labelProduto, labelTipo, whatsappUrl, STATUS_LABEL } from '@/lib/admin-queries'
import { labelBilling } from '@/lib/billing'
import { TZ_BR } from '@/lib/format'

/**
 * Separador `;` e não `,`: o Excel em pt-BR usa ponto-e-vírgula como separador de
 * lista, e com vírgula ele joga a linha inteira numa coluna só. O Sheets detecta
 * os dois. Quem for ler no pandas passa `sep=';'`.
 */
export const SEPARADOR = ';'

/** BOM de UTF-8 — sem ele o Excel lê "João" como "JoÃ£o". */
export const BOM = '﻿'

/**
 * Escapa um campo pro CSV (RFC 4180: aspas dobradas, campo entre aspas quando
 * contém separador/aspas/quebra de linha) e neutraliza injeção de fórmula.
 *
 * Nome e empresa vêm digitados no checkout por qualquer um: um campo começando
 * com `=`, `+`, `-` ou `@` vira fórmula quando o arquivo abre no Excel. O prefixo
 * `'` faz o Excel tratar como texto.
 */
export function escaparCampo(valor: string | number | null | undefined): string {
  let s = valor == null ? '' : String(valor)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  // Vírgula NÃO obriga aspas aqui: o separador é `;`. Fosse por vírgula, todo
  // valor em reais ("570,00") sairia entre aspas à toa.
  const precisaAspas = s.includes(SEPARADOR) || /["\n\r]/.test(s)
  return precisaAspas ? `"${s.replace(/"/g, '""')}"` : s
}

/** Junta cabeçalho + linhas num CSV completo (com BOM e CRLF). */
export function montarCsv(cabecalho: string[], linhas: Array<Array<string | number | null>>): string {
  const tudo = [cabecalho, ...linhas]
  return BOM + tudo.map((l) => l.map(escaparCampo).join(SEPARADOR)).join('\r\n') + '\r\n'
}

/** Valor em reais com vírgula decimal — o Excel pt-BR reconhece como número. */
function reais(centavos: number | null | undefined): string {
  return ((centavos ?? 0) / 100).toFixed(2).replace('.', ',')
}

/** Data em DD/MM/AAAA no fuso do negócio (o Excel pt-BR parseia como data). */
function dataBR(v: unknown): string {
  if (v == null) return ''
  const d = v instanceof Date ? v : new Date(String(v))
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ_BR,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export const CABECALHO_CONTATOS = [
  'nome',
  'email',
  'telefone',
  'whatsapp',
  'produto',
  'tipo_ingresso',
  'pagou',
  'status',
  'valor',
  'meio_pagamento',
  'parcelas',
  'documento',
  'pessoa',
  'empresa',
  'cargo',
  'origem',
  'campanha',
  'como_conheceu',
  'inscricao_em',
  'pago_em',
  'registros',
]

/**
 * Uma linha por pessoa **por produto**: a mesma pessoa que comprou o DSS e o One Day
 * aparece uma vez em cada arquivo, e quem comprou o mesmo produto duas vezes (cobrança
 * regerada, PIX que virou cartão) colapsa numa linha só. Sem isso a lista de contatos
 * nasce com duplicata, que é justamente o que o botão de emails já evita.
 *
 * A linha que sobrevive é a **mais recente** (as `rows` chegam ordenadas por
 * created_at DESC), com duas colunas somando o histórico colapsado:
 *  - `registros`: quantas linhas viraram esta.
 *  - `pagou`: "sim" se QUALQUER uma delas está paga — senão um pendente novo
 *    escondia o pago antigo e a pessoa saía da lista como se não tivesse comprado.
 */
export function montarCsvContatos(rows: InscricaoRow[]): string {
  const porChave = new Map<string, { row: InscricaoRow; registros: number; pagou: boolean }>()
  for (const r of rows) {
    const email = (r.email ?? '').trim()
    if (!email) continue
    const chave = `${email.toLowerCase()}|${r.curso_slug ?? ''}`
    const ja = porChave.get(chave)
    if (ja) {
      ja.registros += 1
      ja.pagou = ja.pagou || r.status === 'paid'
    } else {
      porChave.set(chave, { row: r, registros: 1, pagou: r.status === 'paid' })
    }
  }

  const linhas = [...porChave.values()].map(({ row: r, registros, pagou }) => [
    r.nome ?? '',
    (r.email ?? '').trim(),
    r.telefone ?? '',
    whatsappUrl(r.telefone) ?? '',
    labelProduto(r.curso_slug),
    r.tipo_ingresso ? labelTipo(r.tipo_ingresso) : '',
    pagou ? 'sim' : 'nao',
    STATUS_LABEL[r.status] ?? r.status,
    reais(r.valor_centavos),
    labelBilling(r.billing_type),
    r.installments ?? 1,
    r.cpf_cnpj ?? '',
    r.pessoa_tipo ?? '',
    r.empresa ?? '',
    r.cargo ?? '',
    r.utm_source ?? '',
    r.utm_campaign ?? '',
    r.como_conheceu ?? '',
    dataBR(r.created_at),
    dataBR(r.pago_em ?? r.paid_at),
    registros,
  ])

  return montarCsv(CABECALHO_CONTATOS, linhas)
}

/** `contatos-dss-2026-2026-07-30.csv` — slug vazio (aba Todos) vira "todos". */
export function nomeArquivoCsv(curso: string, hojeISO: string): string {
  const base = (curso || 'todos').replace(/[^a-zA-Z0-9-]/g, '-')
  return `contatos-${base}-${hojeISO}.csv`
}
