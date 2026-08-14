import { describe, it, expect } from 'vitest'
import {
  OPCOES_COBRANCA,
  getOpcaoCobranca,
  opcaoId,
  opcoesComTipos,
  precosDosTipos,
  descricaoManual,
  PREFIXO_MANUAL,
  PROPOSTA_SLUG,
  type TipoParaCobranca,
} from '@/lib/cobranca-manual'
import { precosSugeridosCobranca, PRODUTO_TAB } from '@/lib/admin-queries'
import { PRODUTOS } from '@/lib/produtos'

describe('OPCOES_COBRANCA', () => {
  it('cobre os baldes: curso, DSS (full + One Day), GU, ETT e customizado', () => {
    expect(OPCOES_COBRANCA.map((o) => o.slug)).toEqual([
      'lakehouse-comunidade',
      'dss-2026',
      'dss-one-day-2026',
      'dss-one-day-curso-2026',
      'gubigdata-2026-07',
      'ett-adesao',
      PROPOSTA_SLUG,
    ])
  })

  it('todo slug tem rótulo de aba no painel — senão a venda some numa aba sem nome', () => {
    for (const o of OPCOES_COBRANCA) {
      expect(PRODUTO_TAB[o.slug], `sem PRODUTO_TAB para ${o.slug}`).toBeTruthy()
    }
  })

  it('endereço de PJ espelha a regra do checkout público do produto', () => {
    expect(getOpcaoCobranca('dss-2026')?.enderecoObrigatorioPJ).toBe(
      PRODUTOS['dss-2026'].enderecoObrigatorioPJ,
    )
    // GU é a exceção documentada: evento de comunidade de R$30 não trava por endereço.
    expect(getOpcaoCobranca('gubigdata-2026-07')?.enderecoObrigatorioPJ).toBe(false)
    // Proposta corporativa é o caminho de PJ que mais vira nota.
    expect(getOpcaoCobranca(PROPOSTA_SLUG)?.enderecoObrigatorioPJ).toBe(true)
  })

  it('só o customizado nasce sem descrição sugerida', () => {
    for (const o of OPCOES_COBRANCA) {
      if (o.slug === PROPOSTA_SLUG) expect(o.descricaoPadrao).toBe('')
      else expect(o.descricaoPadrao.length).toBeGreaterThan(3)
    }
  })
})

describe('getOpcaoCobranca', () => {
  it('recusa slug fora da allowlist — curso_slug vem do client', () => {
    expect(getOpcaoCobranca('assinatura')).toBeNull()
    expect(getOpcaoCobranca('preparatorio-dados')).toBeNull() // reserva não cobra
    expect(getOpcaoCobranca('')).toBeNull()
    expect(getOpcaoCobranca('../../etc')).toBeNull()
  })
  it('aceita os slugs da allowlist', () => {
    expect(getOpcaoCobranca('dss-2026')?.label).toBe('Ingresso DSS')
    expect(getOpcaoCobranca(PROPOSTA_SLUG)?.label).toBe('Customizado')
  })
})

describe('descricaoManual', () => {
  it('extrai a descrição do prefixo novo', () => {
    expect(descricaoManual(`${PREFIXO_MANUAL}8 ingressos DSS`)).toBe('8 ingressos DSS')
  })
  it('ainda lê as linhas antigas (prefixo legado em prod)', () => {
    expect(descricaoManual('Proposta customizada: Consultoria')).toBe('Consultoria')
  })
  it('null quando a venda não é manual', () => {
    expect(descricaoManual('Indicação de um amigo')).toBeNull()
    expect(descricaoManual(null)).toBeNull()
    expect(descricaoManual('')).toBeNull()
  })
})

// Sem isto, vender o Estudante na mão obrigava a escolher "Ingresso DSS", digitar
// R$400 de cabeça, e a venda nascia sem tipo — fora da lotação e do breakdown.
describe('opcoesComTipos (tipos de ingresso no seletor da cobrança avulsa)', () => {
  const tipos: TipoParaCobranca[] = [
    { produto_slug: 'dss-2026', tipo_id: 'lote-1', nome: 'Lote 1', preco_centavos: 57000, oculto: false },
    { produto_slug: 'dss-2026', tipo_id: 'estudante', nome: 'Estudante', preco_centavos: 40000, oculto: true },
    { produto_slug: 'gubigdata-2026-07', tipo_id: 'associado', nome: 'Associado', preco_centavos: 0, oculto: false },
  ]
  const opcoes = opcoesComTipos(OPCOES_COBRANCA, tipos)

  it('cada tipo entra logo abaixo do produto dele, sem tirar ninguém da lista', () => {
    const ids = opcoes.map(opcaoId)
    expect(ids).toContain('dss-2026')
    expect(ids.indexOf('dss-2026:estudante')).toBe(ids.indexOf('dss-2026') + 2) // depois do lote-1
    expect(opcoes.length).toBe(OPCOES_COBRANCA.length + 2) // o gratuito do GU não entra
  })

  it('ingresso oculto aparece aqui — vender na mão é justamente o caso dele', () => {
    expect(getOpcaoCobranca('dss-2026:estudante', opcoes)?.label).toBe('Ingresso DSS — Estudante')
  })

  it('gratuito fica de fora: cobrança de R$ 0 não existe', () => {
    expect(getOpcaoCobranca('gubigdata-2026-07:associado', opcoes)).toBeNull()
  })

  it('o tipo herda produto e regra de endereço de PJ — a venda cai na mesma aba', () => {
    const est = getOpcaoCobranca('dss-2026:estudante', opcoes)!
    expect(est.slug).toBe('dss-2026')
    expect(est.tipo_ingresso).toBe('estudante')
    expect(est.enderecoObrigatorioPJ).toBe(getOpcaoCobranca('dss-2026')!.enderecoObrigatorioPJ)
    expect(est.descricaoPadrao).toContain('Estudante')
  })

  it('preço sugerido vem do catálogo, e a dica avisa quando é ingresso oculto', () => {
    const precos = precosDosTipos(tipos)
    expect(precos['dss-2026:estudante'].centavos).toBe(40000)
    expect(precos['dss-2026:estudante'].dica).toContain('oculto')
    expect(precos['gubigdata-2026-07:associado']).toBeUndefined()
  })

  it('produto sem tipo cadastrado continua com id simples (nada quebra)', () => {
    expect(opcaoId(getOpcaoCobranca(PROPOSTA_SLUG, opcoes)!)).toBe(PROPOSTA_SLUG)
  })
})

describe('precosSugeridosCobranca', () => {
  const precos = precosSugeridosCobranca()

  it('sugere o preço de tabela de cada produto real', () => {
    expect(precos['dss-2026'].centavos).toBe(PRODUTOS['dss-2026'].precoCentavos)
    expect(precos['gubigdata-2026-07'].centavos).toBe(PRODUTOS['gubigdata-2026-07'].precoCentavos)
    expect(precos['lakehouse-comunidade'].centavos).toBe(75000) // não-membro
  })

  it('customizado não tem sugestão — o campo nasce vazio', () => {
    expect(precos[PROPOSTA_SLUG]).toBeUndefined()
  })

  it('a dica diz de onde veio o número', () => {
    expect(precos['lakehouse-comunidade'].dica).toContain('550') // preço de membro
    expect(precos['dss-2026'].dica).toContain('820') // âncora do preço cheio
  })
})
