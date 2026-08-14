// Cobrança manual (admin): o que dá pra faturar pela tela /admin/cobranca.
// Não confundir com lib/produtos.ts (registry de preço/checkout público): aqui o
// valor é SEMPRE digitado pelo admin — o produto escolhido só decide o balde
// (curso_slug), a descrição sugerida e se PJ precisa de endereço pra nota.
import { PRODUTOS } from '@/lib/produtos'

/** Slug das cobranças sem produto — aparece como "Proposta customizada" no admin. */
export const PROPOSTA_SLUG = 'proposta'

/** utm_source gravado em toda cobrança nascida no admin (não veio do site). */
export const ORIGEM_ADMIN = 'admin'

/** Prefixo da descrição gravada em como_conheceu (não há coluna dedicada). */
export const PREFIXO_MANUAL = 'Cobrança manual: '
/** Prefixo das linhas geradas antes do seletor de produto — segue em prod. */
const PREFIXO_LEGADO = 'Proposta customizada: '

/** Extrai a descrição digitada pelo admin. Null quando a venda não é manual. */
export function descricaoManual(comoConheceu: string | null): string | null {
  const raw = comoConheceu ?? ''
  for (const p of [PREFIXO_MANUAL, PREFIXO_LEGADO]) {
    if (raw.startsWith(p)) return raw.slice(p.length)
  }
  return null
}

export interface OpcaoCobranca {
  /** curso_slug gravado na venda — é o que joga a linha na aba certa do painel */
  slug: string
  /**
   * Variante do produto (`tipos_ingresso.tipo_id`), quando a opção é um ingresso
   * específico — ex.: `estudante` do DSS. Gravada em `inscricoes.tipo_ingresso`,
   * que é o que acende o breakdown "Por tipo" do painel.
   */
  tipo_ingresso?: string | null
  /** rótulo do botão no seletor */
  label: string
  /** descrição sugerida (vai pra fatura do cliente); vazia = admin escreve */
  descricaoPadrao: string
  /**
   * PJ só fecha com endereço completo — é o que permite emitir a nota depois.
   * Espelha a regra do checkout público de cada produto (ver [[produtos]]).
   */
  enderecoObrigatorioPJ: boolean
}

export const OPCOES_COBRANCA: OpcaoCobranca[] = [
  {
    slug: 'lakehouse-comunidade',
    label: 'Curso',
    descricaoPadrao: 'Curso Lakehouse: Pipeline na Prática',
    enderecoObrigatorioPJ: true,
  },
  {
    slug: 'dss-2026',
    label: 'Ingresso DSS',
    descricaoPadrao: PRODUTOS['dss-2026'].asaasDescricao,
    enderecoObrigatorioPJ: PRODUTOS['dss-2026'].enderecoObrigatorioPJ,
  },
  {
    slug: 'dss-one-day-2026',
    label: 'Ingresso DSS One Day',
    descricaoPadrao: PRODUTOS['dss-one-day-2026'].asaasDescricao,
    enderecoObrigatorioPJ: PRODUTOS['dss-one-day-2026'].enderecoObrigatorioPJ,
  },
  {
    slug: 'dss-one-day-curso-2026',
    label: 'DSS One Day + Curso',
    descricaoPadrao: PRODUTOS['dss-one-day-curso-2026'].asaasDescricao,
    enderecoObrigatorioPJ: PRODUTOS['dss-one-day-curso-2026'].enderecoObrigatorioPJ,
  },
  {
    slug: 'gubigdata-2026-07',
    label: 'Ingresso GU',
    descricaoPadrao: PRODUTOS['gubigdata-2026-07'].asaasDescricao,
    // false, como no checkout do GU: evento de comunidade de R$30 não trava por endereço.
    enderecoObrigatorioPJ: PRODUTOS['gubigdata-2026-07'].enderecoObrigatorioPJ,
  },
  {
    slug: 'ett-adesao',
    label: 'ETT Adesão',
    descricaoPadrao: PRODUTOS['ett-adesao'].asaasDescricao,
    // Pessoa física; PJ que quiser nota preenche endereço por opção.
    enderecoObrigatorioPJ: PRODUTOS['ett-adesao'].enderecoObrigatorioPJ,
  },
  {
    slug: PROPOSTA_SLUG,
    label: 'Customizado',
    descricaoPadrao: '',
    // Proposta corporativa é o caminho de PJ que mais vira nota.
    enderecoObrigatorioPJ: true,
  },
]

/** Chave da opção no seletor: slug sozinho deixou de bastar quando os tipos entraram. */
export function opcaoId(o: Pick<OpcaoCobranca, 'slug' | 'tipo_ingresso'>): string {
  return o.tipo_ingresso ? `${o.slug}:${o.tipo_ingresso}` : o.slug
}

export function getOpcaoCobranca(id: string, opcoes: OpcaoCobranca[] = OPCOES_COBRANCA): OpcaoCobranca | null {
  return opcoes.find((o) => opcaoId(o) === id) ?? null
}

/** O que a cobrança manual precisa saber de um tipo de ingresso cadastrado. */
export interface TipoParaCobranca {
  produto_slug: string
  tipo_id: string
  nome: string
  preco_centavos: number
  oculto: boolean
}

/**
 * Enfia cada tipo de ingresso cadastrado logo abaixo do produto dele (regra PURA).
 *
 * Sem isso, vender na mão um ingresso que só existe no catálogo do banco — o
 * Estudante do DSS, por exemplo — obrigaria a escolher "Ingresso DSS" e digitar
 * o valor de cabeça, e a venda nasceria **sem `tipo_ingresso`**: fora da lotação
 * do lote e fora do breakdown por tipo. Gratuitos ficam de fora: cobrança de R$ 0
 * não existe.
 */
export function opcoesComTipos(base: OpcaoCobranca[], tipos: TipoParaCobranca[]): OpcaoCobranca[] {
  return base.flatMap((o) => {
    const doProduto = tipos.filter((t) => t.produto_slug === o.slug && t.preco_centavos > 0)
    return [
      o,
      ...doProduto.map((t) => ({
        slug: o.slug,
        tipo_ingresso: t.tipo_id,
        label: `${o.label} — ${t.nome}`,
        descricaoPadrao: `${o.descricaoPadrao} — ${t.nome}`,
        enderecoObrigatorioPJ: o.enderecoObrigatorioPJ,
      })),
    ]
  })
}

/** Preço sugerido de cada tipo — o do catálogo. O admin edita como sempre. */
export function precosDosTipos(tipos: TipoParaCobranca[]): PrecosSugeridos {
  const m: PrecosSugeridos = {}
  for (const t of tipos) {
    if (t.preco_centavos <= 0) continue
    m[`${t.produto_slug}:${t.tipo_id}`] = {
      centavos: t.preco_centavos,
      dica: t.oculto ? 'tipo oculto (só por link) · /admin/ingressos' : 'tipo cadastrado em /admin/ingressos',
    }
  }
  return m
}

/** Preço de tabela sugerido no form. Sugestão — o admin edita (lote corporativo, desconto). */
export interface PrecoSugerido {
  centavos: number
  /** de onde veio o número, em uma linha curta */
  dica: string
}
export type PrecosSugeridos = Record<string, PrecoSugerido>
