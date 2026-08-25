import type { TipoIngresso } from '@/lib/tipos-ingresso'

// Escada de lotes do checkout: mostra de onde o preço veio e pra onde ele vai.
//
// Nasceu na virada do Lote 1 (R$570) pro Lote 2 (R$670): desligar o lote velho fez o
// card dele sumir da vitrine, e quem chegava via só um preço solto, sem referência.
//
// A escada é DERIVADA do catálogo (/admin/ingressos) — nunca de texto fixo. Lote velho
// continua cadastrado, só que inativo; é ele que vira o degrau riscado. O degrau final
// é a âncora do lote vigente (`preco_de_centavos`), o preço de quem deixar pro dia.
//
// Ingresso oculto (Estudante) NÃO é degrau: ele é um preço reservado a um público, não
// um momento da venda. Colocá-lo aqui vazaria na vitrine o link que existe pra ser
// discreto.

export type EstadoDegrau = 'encerrado' | 'atual' | 'proximo' | 'final'

export interface DegrauLote {
  nome: string
  /** preço de tabela do degrau, em reais */
  valor: number
  estado: EstadoDegrau
  /** preço do degrau vigente já com o cupom do link, em reais (só quando há desconto) */
  valorComCupom?: number
}

export interface OpcoesEscada {
  /** preço do lote vigente já com cupom aplicado, em centavos (só quando há cupom) */
  atualComCupomCentavos?: number | null
  /** rótulo do degrau da âncora */
  rotuloFinal?: string
}

/**
 * Monta a escada a partir dos tipos do produto (ativos e inativos, ocultos fora).
 * Devolve [] quando não há o que comparar — um lote sozinho, sem âncora, não é escada:
 * renderizar um degrau só é ruído.
 */
export function montarEscada(tipos: TipoIngresso[], opcoes: OpcoesEscada = {}): DegrauLote[] {
  const { atualComCupomCentavos = null, rotuloFinal = 'No dia' } = opcoes
  const lotes = tipos.filter((t) => !t.oculto)
  const vigente = lotes.find((t) => t.ativo)
  if (!vigente) return []

  const degraus: DegrauLote[] = lotes.map((t) => ({
    nome: t.nome,
    valor: t.preco_centavos / 100,
    // Inativo mais barato que o vigente já foi; mais caro ainda não chegou. É o que
    // separa "você perdeu" de "vai subir" sem depender de data nenhuma.
    estado: t.ativo ? 'atual' : t.preco_centavos < vigente.preco_centavos ? 'encerrado' : 'proximo',
  }))

  const ancora = vigente.preco_de_centavos
  if (ancora > vigente.preco_centavos && !degraus.some((d) => d.valor === ancora / 100)) {
    degraus.push({ nome: rotuloFinal, valor: ancora / 100, estado: 'final' })
  }

  if (degraus.length < 2) return []

  if (atualComCupomCentavos != null && atualComCupomCentavos < vigente.preco_centavos) {
    const atual = degraus.find((d) => d.estado === 'atual')
    if (atual) atual.valorComCupom = atualComCupomCentavos / 100
  }

  return degraus.sort((a, b) => a.valor - b.valor)
}
