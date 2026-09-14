import { disponibilidadeDoTipo, type TipoIngresso } from '@/lib/tipos-ingresso'
import type { DegrauLote } from '@/lib/escada-lotes'

// Lote que vira sozinho por QUANTIDADE — VIP e Business do DSS 2026.
//
// Diferente do FullPass, onde a virada é manual (desliga o Lote 1, liga o Lote 2 no
// admin), aqui os três lotes ficam ATIVOS ao mesmo tempo, cada um com `limite_qtd`.
// O vigente é o primeiro (por `ordem`) que ainda tem vaga; quando os 10 do Lote 1
// fecham, a página e o servidor passam a vender o Lote 2 sem ninguém mexer em nada.
//
// Lotação conta pago + pendente (regra de `contarInscritosPorTipo`): PIX gerado e não
// pago segura a vaga até vencer. É o preço de não vender 11 ingressos de um lote de 10.
//
// Desligar um lote no admin (`ativo=false`) tira ele da escada — é como pular um lote.

export interface EscadaQuantidade {
  /** lote à venda agora; null = sem catálogo ou tudo esgotado */
  vigente: TipoIngresso | null
  /** vagas que sobram no lote vigente (null = lote sem limite) */
  restantes: number | null
  /** true quando existe lote cadastrado e nenhum tem vaga */
  esgotado: boolean
  degraus: DegrauLote[]
}

/** Regra PURA — testável. `inscritos` = paid+pending não-teste por `tipo_id`. */
export function escadaPorQuantidade(
  tipos: TipoIngresso[],
  inscritos: Record<string, number>,
  hoje: string
): EscadaQuantidade {
  const lotes = tipos.filter((t) => t.ativo && !t.oculto).sort((a, b) => a.ordem - b.ordem || a.id - b.id)
  const idx = lotes.findIndex((t) => disponibilidadeDoTipo(t, hoje, inscritos[t.tipo_id] ?? 0).disponivel)
  const vigente = idx >= 0 ? lotes[idx] : null

  const degraus: DegrauLote[] = lotes.map((t, i) => ({
    nome: t.nome,
    valor: t.preco_centavos / 100,
    estado: idx < 0 || i < idx ? 'encerrado' : i === idx ? 'atual' : 'proximo',
  }))

  return {
    vigente,
    restantes:
      vigente && vigente.limite_qtd != null
        ? Math.max(vigente.limite_qtd - (inscritos[vigente.tipo_id] ?? 0), 0)
        : null,
    esgotado: lotes.length > 0 && idx < 0,
    degraus: degraus.length >= 2 ? degraus : [],
  }
}
