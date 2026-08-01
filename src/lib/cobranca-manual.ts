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

export function getOpcaoCobranca(slug: string): OpcaoCobranca | null {
  return OPCOES_COBRANCA.find((o) => o.slug === slug) ?? null
}

/** Preço de tabela sugerido no form. Sugestão — o admin edita (lote corporativo, desconto). */
export interface PrecoSugerido {
  centavos: number
  /** de onde veio o número, em uma linha curta */
  dica: string
}
export type PrecosSugeridos = Record<string, PrecoSugerido>
