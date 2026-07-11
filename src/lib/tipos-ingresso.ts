// Catálogo de tipos de ingresso (variantes de um produto), cadastrável no admin.
// Fonte da verdade do preço por tipo — o checkout lê os tipos ATIVOS daqui e deriva
// o valor SEMPRE no servidor. Se um produto não tem tipos, o checkout cai no preço
// único de lib/produtos.ts. Percentuais são em % inteiro (10 = 10%).
import { sql } from '@/lib/db'
import { valorParcela, totalComJuros, MAX_PARCELAS } from '@/lib/parcelamento'

export interface TipoIngresso {
  id: number
  produto_slug: string
  tipo_id: string
  nome: string
  descricao: string | null
  preco_centavos: number // 0 = ingresso gratuito (só cadastro, sem Asaas)
  preco_de_centavos: number
  pix_desconto_pct: number // % (10 = 10%)
  cartao_acrescimo_pct: number // %
  max_parcelas: number
  ativo: boolean
  ordem: number
  vendas_ate: string | null // 'YYYY-MM-DD' inclusive; null = sem prazo
  limite_qtd: number | null // lotação (paid+pending, sem teste); null = sem limite
}

/** DATE do Postgres pode vir como string ou Date, dependendo do driver. */
function isoDate(v: unknown): string | null {
  if (v == null) return null
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

function mapRow(r: Record<string, unknown>): TipoIngresso {
  return {
    id: Number(r.id),
    produto_slug: String(r.produto_slug),
    tipo_id: String(r.tipo_id),
    nome: String(r.nome),
    descricao: r.descricao == null ? null : String(r.descricao),
    preco_centavos: Number(r.preco_centavos),
    preco_de_centavos: Number(r.preco_de_centavos),
    pix_desconto_pct: Number(r.pix_desconto_pct),
    cartao_acrescimo_pct: Number(r.cartao_acrescimo_pct),
    max_parcelas: Number(r.max_parcelas),
    ativo: Boolean(r.ativo),
    ordem: Number(r.ordem),
    vendas_ate: isoDate(r.vendas_ate),
    limite_qtd: r.limite_qtd == null ? null : Number(r.limite_qtd),
  }
}

/** Todos os tipos de um produto (ou de todos), incluindo inativos — pro admin. */
export async function listarTipos(produto_slug?: string): Promise<TipoIngresso[]> {
  const rows = produto_slug
    ? ((await sql`SELECT * FROM tipos_ingresso WHERE produto_slug = ${produto_slug} ORDER BY produto_slug, ordem, id`) as Record<
        string,
        unknown
      >[])
    : ((await sql`SELECT * FROM tipos_ingresso ORDER BY produto_slug, ordem, id`) as Record<string, unknown>[])
  return rows.map(mapRow)
}

/** Só os tipos ATIVOS de um produto, em ordem — pro checkout. */
export async function listarTiposAtivos(produto_slug: string): Promise<TipoIngresso[]> {
  const rows = (await sql`
    SELECT * FROM tipos_ingresso
    WHERE produto_slug = ${produto_slug} AND ativo = true
    ORDER BY ordem, id
  `) as Record<string, unknown>[]
  return rows.map(mapRow)
}

/** Um tipo específico (independente de ativo/inativo). */
export async function getTipo(produto_slug: string, tipo_id: string): Promise<TipoIngresso | null> {
  const rows = (await sql`
    SELECT * FROM tipos_ingresso WHERE produto_slug = ${produto_slug} AND tipo_id = ${tipo_id}
  `) as Record<string, unknown>[]
  return rows[0] ? mapRow(rows[0]) : null
}

export interface UpsertTipoInput {
  id?: number
  produto_slug: string
  tipo_id: string
  nome: string
  descricao?: string | null
  preco_centavos: number
  preco_de_centavos?: number
  pix_desconto_pct?: number
  cartao_acrescimo_pct?: number
  max_parcelas?: number
  ativo?: boolean
  ordem?: number
  vendas_ate?: string | null
  limite_qtd?: number | null
}

/** Cria ou atualiza um tipo (chave lógica: produto_slug + tipo_id). */
export async function upsertTipo(i: UpsertTipoInput): Promise<TipoIngresso> {
  const rows = (await sql`
    INSERT INTO tipos_ingresso (
      produto_slug, tipo_id, nome, descricao, preco_centavos, preco_de_centavos,
      pix_desconto_pct, cartao_acrescimo_pct, max_parcelas, ativo, ordem,
      vendas_ate, limite_qtd
    ) VALUES (
      ${i.produto_slug}, ${i.tipo_id}, ${i.nome}, ${i.descricao ?? null},
      ${i.preco_centavos}, ${i.preco_de_centavos ?? 0},
      ${i.pix_desconto_pct ?? 0}, ${i.cartao_acrescimo_pct ?? 0},
      ${i.max_parcelas ?? 1}, ${i.ativo ?? true}, ${i.ordem ?? 0},
      ${i.vendas_ate ?? null}, ${i.limite_qtd ?? null}
    )
    ON CONFLICT (produto_slug, tipo_id) DO UPDATE SET
      nome = EXCLUDED.nome,
      descricao = EXCLUDED.descricao,
      preco_centavos = EXCLUDED.preco_centavos,
      preco_de_centavos = EXCLUDED.preco_de_centavos,
      pix_desconto_pct = EXCLUDED.pix_desconto_pct,
      cartao_acrescimo_pct = EXCLUDED.cartao_acrescimo_pct,
      max_parcelas = EXCLUDED.max_parcelas,
      ativo = EXCLUDED.ativo,
      ordem = EXCLUDED.ordem,
      vendas_ate = EXCLUDED.vendas_ate,
      limite_qtd = EXCLUDED.limite_qtd,
      updated_at = NOW()
    RETURNING *
  `) as Record<string, unknown>[]
  return mapRow(rows[0])
}

export async function deletarTipo(id: number): Promise<void> {
  await sql`DELETE FROM tipos_ingresso WHERE id = ${id}`
}

// --- Gratuidade e disponibilidade (janela de vendas + lotação) ---

/** Ingresso gratuito: só cadastro, sem cobrança no Asaas. */
export function ehGratuito(t: TipoIngresso): boolean {
  return t.preco_centavos === 0
}

export type MotivoIndisponivel = 'encerrado' | 'esgotado'

/**
 * Disponibilidade de um tipo pra venda (regra PURA — testável).
 * `hoje` em YYYY-MM-DD (BRT); `inscritos` = paid+pending não-teste do tipo.
 */
export function disponibilidadeDoTipo(
  t: Pick<TipoIngresso, 'ativo' | 'vendas_ate' | 'limite_qtd'>,
  hoje: string,
  inscritos: number
): { disponivel: boolean; motivo: MotivoIndisponivel | null } {
  if (!t.ativo) return { disponivel: false, motivo: 'encerrado' }
  if (t.vendas_ate && hoje > t.vendas_ate) return { disponivel: false, motivo: 'encerrado' }
  if (t.limite_qtd != null && inscritos >= t.limite_qtd) return { disponivel: false, motivo: 'esgotado' }
  return { disponivel: true, motivo: null }
}

/** Inscritos (paid+pending, sem teste) por tipo_ingresso de um produto — pra lotação. */
export async function contarInscritosPorTipo(produto_slug: string): Promise<Record<string, number>> {
  const rows = (await sql`
    SELECT tipo_ingresso, COUNT(*)::int AS qtd
    FROM inscricoes
    WHERE curso_slug = ${produto_slug}
      AND status IN ('paid', 'pending')
      AND NOT is_teste
      AND tipo_ingresso IS NOT NULL
    GROUP BY tipo_ingresso
  `) as Array<{ tipo_ingresso: string; qtd: number }>
  const m: Record<string, number> = {}
  for (const r of rows) m[r.tipo_ingresso] = Number(r.qtd)
  return m
}

// --- Cálculo de preço (server-side, mesma regra de lib/produtos.ts) ---

export interface PrecosTipo {
  precoBaseReais: number
  precoPixReais: number
  precoCartaoBaseReais: number
  precoDeVendaReais: number
  maxParcelas: number
}

/** Preços derivados de um tipo pra exibição no checkout. */
export function precosDoTipo(t: TipoIngresso): PrecosTipo {
  const base = t.preco_centavos / 100
  const pix = Number((base * (1 - t.pix_desconto_pct / 100)).toFixed(2))
  const cartao = Number((base * (1 + t.cartao_acrescimo_pct / 100)).toFixed(2))
  return {
    precoBaseReais: base,
    precoPixReais: pix,
    precoCartaoBaseReais: cartao,
    precoDeVendaReais: t.preco_de_centavos / 100,
    maxParcelas: Math.min(Math.max(t.max_parcelas, 1), MAX_PARCELAS),
  }
}

export interface ValorCobrado {
  valorReais: number
  valorCentavos: number
  installments: number
  installmentValueReais: number
}

/** Valor efetivamente cobrado de um tipo, conforme forma de pagamento. */
export function valorCobradoDoTipo(
  t: TipoIngresso,
  billing_type: 'PIX' | 'CREDIT_CARD',
  installments: number
): ValorCobrado {
  const { precoPixReais, precoCartaoBaseReais, maxParcelas } = precosDoTipo(t)
  const n = billing_type === 'CREDIT_CARD' ? Math.min(Math.max(installments, 1), maxParcelas) : 1
  const installmentValueReais = valorParcela(precoCartaoBaseReais, n)
  const valorReais = billing_type === 'PIX' ? precoPixReais : totalComJuros(precoCartaoBaseReais, n)
  return {
    valorReais,
    valorCentavos: Math.round(valorReais * 100),
    installments: n,
    installmentValueReais,
  }
}
