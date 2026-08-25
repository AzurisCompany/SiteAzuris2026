import type { LoteExibicao } from '../PasseCheckout'

// Escada de lotes do Passe One Day — só EXIBIÇÃO. Quem diz o preço cobrado é
// PRODUTOS['dss-one-day-2026'].precoCentavos ([[produtos]]); aqui mora o NOME do lote
// vigente e os vizinhos riscados.
//
// Mora num módulo próprio porque a escada estava duplicada na landing (/dssbr-2026) e
// no checkout (/dssbr-2026/one-day): dois lugares pra virar o lote, nenhum teste, e
// quem esquecesse um deles anunciava um lote e cobrava outro.
//
// Virar o lote = mover o `atual` daqui e subir o `precoCentavos` do registry. O canário
// `precos-one-day.test.ts` reprova se os dois discordarem.
export const LOTES_ONE_DAY: LoteExibicao[] = [
  { nome: 'Lote 1', valor: 247, atual: false }, // encerrado em 25/08/2026
  { nome: 'Lote 2', valor: 290, atual: true },
  { nome: 'Lote 3', valor: 357, atual: false },
]

/** Lote que está vendendo — rótulo do card na landing e no resumo do checkout. */
export const LOTE_ONEDAY_ATUAL: LoteExibicao =
  LOTES_ONE_DAY.find((l) => l.atual) ?? LOTES_ONE_DAY[0]
