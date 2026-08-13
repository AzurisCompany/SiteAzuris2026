// Cadastro de cupons de desconto — a REGRA de cada desconto, não os links.
//
// Dois tipos, mesma tabela:
//
//  - `vendedora`: tem `validade_horas` (ex.: 48). Ela entra em /vendas, digita o
//    código e recebe um link assinado que morre sozinho. O código dela NÃO vale
//    como link — se vale-tudo bastasse o código, o prazo não existiria.
//  - `parceiro`: `validade_horas = null`. O link É o código: `?c=gaio15`, sem
//    prazo. Só existe porque tem botão de desligar (`ativo = false`).
//
// O checkout consulta esta tabela A CADA uso ([[checkout-produto]]), então
// desligar um cupom mata todos os links dele na hora — inclusive os que já
// estão na mão de cliente. É isso que torna "sem prazo" defensável.
import { sql } from '@/lib/db'
import { lerCupom, aplicarDesconto, normalizarCodigo, codigoValido, CUPOM_PCT_MAX } from '@/lib/cupom'

export type TipoCupom = 'vendedora' | 'parceiro'

export interface Cupom {
  id: number
  codigo: string
  nome: string
  tipo: TipoCupom
  produto_slug: string
  pct: number
  /** null = link sem prazo (parceiro) */
  validade_horas: number | null
  /** null = sem limite de inscrições */
  limite_usos: number | null
  ativo: boolean
}

/** Cupom + quanto ele já vendeu (pro painel do admin). */
export interface CupomComUso extends Cupom {
  usos: number
  receita_centavos: number
}

function mapRow(r: Record<string, unknown>): Cupom {
  return {
    id: Number(r.id),
    codigo: String(r.codigo),
    nome: String(r.nome),
    tipo: r.tipo === 'parceiro' ? 'parceiro' : 'vendedora',
    produto_slug: String(r.produto_slug),
    pct: Number(r.pct),
    validade_horas: r.validade_horas == null ? null : Number(r.validade_horas),
    limite_usos: r.limite_usos == null ? null : Number(r.limite_usos),
    ativo: Boolean(r.ativo),
  }
}

// --- Leitura ---

/**
 * Todos os cupons com o que cada um já vendeu. `usos` conta paid+pending (uma
 * inscrição pendente já consumiu a vaga do limite); a receita só conta o que
 * de fato entrou.
 */
export async function listarCuponsComUso(): Promise<CupomComUso[]> {
  const rows = (await sql`
    SELECT c.*,
           COALESCE(u.usos, 0)::int             AS usos,
           COALESCE(u.receita_centavos, 0)::int AS receita_centavos
    FROM cupons c
    LEFT JOIN (
      SELECT LOWER(utm_content) AS codigo,
             COUNT(*) FILTER (WHERE status IN ('paid','pending'))              AS usos,
             COALESCE(SUM(valor_centavos) FILTER (WHERE status = 'paid'), 0)   AS receita_centavos
      FROM inscricoes
      WHERE utm_source IN ('vendedora','parceiro') AND utm_content IS NOT NULL AND NOT is_teste
      GROUP BY LOWER(utm_content)
    ) u ON u.codigo = c.codigo
    ORDER BY c.ativo DESC, c.tipo, c.nome
  `) as Record<string, unknown>[]
  return rows.map((r) => ({ ...mapRow(r), usos: Number(r.usos), receita_centavos: Number(r.receita_centavos) }))
}

export async function getCupom(codigo: string): Promise<Cupom | null> {
  const c = normalizarCodigo(codigo)
  if (!codigoValido(c)) return null
  const rows = (await sql`SELECT * FROM cupons WHERE codigo = ${c}`) as Record<string, unknown>[]
  return rows[0] ? mapRow(rows[0]) : null
}

/** Inscrições que já entraram por um cupom (paid+pending, sem teste). */
export async function contarUsos(codigo: string): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS n
    FROM inscricoes
    WHERE LOWER(utm_content) = ${normalizarCodigo(codigo)}
      AND utm_source IN ('vendedora','parceiro')
      AND status IN ('paid','pending')
      AND NOT is_teste
  `) as Array<{ n: number }>
  return Number(rows[0]?.n ?? 0)
}

// --- Escrita ---

export interface UpsertCupomInput {
  id?: number
  codigo: string
  nome: string
  tipo: TipoCupom
  produto_slug: string
  pct: number
  validade_horas: number | null
  limite_usos: number | null
  ativo: boolean
}

/** Cria ou atualiza (chave lógica: o código). */
export async function upsertCupom(i: UpsertCupomInput): Promise<Cupom> {
  const rows = (await sql`
    INSERT INTO cupons (codigo, nome, tipo, produto_slug, pct, validade_horas, limite_usos, ativo)
    VALUES (${normalizarCodigo(i.codigo)}, ${i.nome}, ${i.tipo}, ${i.produto_slug}, ${i.pct},
            ${i.validade_horas}, ${i.limite_usos}, ${i.ativo})
    ON CONFLICT (codigo) DO UPDATE SET
      nome = EXCLUDED.nome,
      tipo = EXCLUDED.tipo,
      produto_slug = EXCLUDED.produto_slug,
      pct = EXCLUDED.pct,
      validade_horas = EXCLUDED.validade_horas,
      limite_usos = EXCLUDED.limite_usos,
      ativo = EXCLUDED.ativo,
      updated_at = NOW()
    RETURNING *
  `) as Record<string, unknown>[]
  return mapRow(rows[0])
}

export async function deletarCupom(id: number): Promise<void> {
  await sql`DELETE FROM cupons WHERE id = ${id}`
}

// --- A regra que o checkout usa ---

export interface DescontoAplicado {
  codigo: string
  nome: string
  tipo: TipoCupom
  pct: number
  /** quando o link morre (só existe em link de vendedora) */
  exp: number | null
}

export type MotivoRecusa = 'inexistente' | 'desligado' | 'outro_produto' | 'esgotado' | 'exige_link' | 'invalido'

/**
 * Resolve o desconto de uma visita ao checkout. Aceita as duas formas:
 *
 *  - `token` (`?d=`): link de vendedora, assinado, com prazo dentro da assinatura.
 *  - `codigo` (`?c=`): link de parceiro, código puro — **só** vale pra cupom sem prazo.
 *
 * Devolve `null` pra qualquer recusa: o checkout segue no preço cheio, nunca
 * mostra erro. O percentual que vale é o da LINHA, não o do token — mudar 15%
 * pra 12% no admin muda os links que já estão na rua.
 */
export async function resolverDesconto(
  entrada: { token?: string | null; codigo?: string | null },
  produtoSlug: string,
  agoraMs = Date.now()
): Promise<{ aplicado: DescontoAplicado | null; recusa: MotivoRecusa | null }> {
  const recusar = (recusa: MotivoRecusa) => ({ aplicado: null, recusa })

  let codigo: string
  let exp: number | null = null

  if (entrada.token) {
    const t = lerCupom(entrada.token, produtoSlug, agoraMs)
    if (!t) return recusar('invalido') // assinatura errada, vencido ou outro produto
    codigo = t.codigo
    exp = t.exp
  } else if (entrada.codigo) {
    codigo = normalizarCodigo(entrada.codigo)
    if (!codigoValido(codigo)) return recusar('invalido')
  } else {
    return { aplicado: null, recusa: null } // visita normal, sem cupom
  }

  let cupom: Cupom | null
  try {
    cupom = await getCupom(codigo)
  } catch {
    // Banco fora do ar: nega o desconto em vez de conceder no escuro.
    return recusar('invalido')
  }

  if (!cupom) return recusar('inexistente')
  if (!cupom.ativo) return recusar('desligado')
  if (cupom.produto_slug !== produtoSlug) return recusar('outro_produto')

  // Cupom com prazo só circula como link assinado. Sem esta trava, bastaria usar
  // ?c=<código da vendedora> pra ter um link permanente e furar as 48h.
  if (!entrada.token && cupom.validade_horas != null) return recusar('exige_link')

  if (!Number.isInteger(cupom.pct) || cupom.pct < 1 || cupom.pct > CUPOM_PCT_MAX) return recusar('invalido')

  if (cupom.limite_usos != null) {
    try {
      if ((await contarUsos(cupom.codigo)) >= cupom.limite_usos) return recusar('esgotado')
    } catch {
      return recusar('invalido')
    }
  }

  return {
    aplicado: { codigo: cupom.codigo, nome: cupom.nome, tipo: cupom.tipo, pct: cupom.pct, exp },
    recusa: null,
  }
}

/** Reexport de conveniência — quem resolve desconto quase sempre vai aplicá-lo. */
export { aplicarDesconto }
