// Carregamento dos ingressos de um evento presencial, do banco pra tela.
//
// Era o mesmo bloco copiado na página do evento e no checkout do GU; virou função
// quando o café de networking pediu os dois de novo. Tolerante a banco fora: devolve
// lista vazia, e a página mostra "inscrições em breve" em vez de estourar.

import { hojeBRT } from '@/lib/format'
import {
  listarTiposPublicos,
  getTipo,
  aplicarTipoDoLink,
  contarInscritosPorTipo,
  disponibilidadeDoTipo,
  precosDoTipo,
  ehGratuito,
} from '@/lib/tipos-ingresso'
import type { TicketOption } from '@/components/evento/TicketBox'
import type { TipoGuOption } from '@/components/evento/InscricaoEventoForm'

/** "2026-10-06" → "06/10" (o que a UI mostra como prazo de venda). */
function dataBR(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

/** Vitrine da PÁGINA do evento: só o que é público, com disponibilidade resolvida. */
export async function carregarTickets(slug: string): Promise<TicketOption[]> {
  try {
    const [tipos, inscritos] = await Promise.all([listarTiposPublicos(slug), contarInscritosPorTipo(slug)])
    const hoje = hojeBRT()
    return tipos.map((t) => {
      const p = precosDoTipo(t)
      const disp = disponibilidadeDoTipo(t, hoje, inscritos[t.tipo_id] ?? 0)
      return {
        tipo_id: t.tipo_id,
        nome: t.nome,
        gratuito: ehGratuito(t),
        precoReais: p.precoPixReais,
        maxParcelas: p.maxParcelas,
        vendasAte: t.vendas_ate ? t.vendas_ate.split('-').reverse().join('/') : null,
        disponivel: disp.disponivel,
        motivo: disp.motivo,
      }
    })
  } catch {
    return []
  }
}

/**
 * Vitrine do CHECKOUT: os públicos mais, quando o link pede, um tipo OCULTO
 * ([[tipos-ingresso]]). `selecionado` é o que já vem marcado no formulário.
 */
export async function carregarTiposCheckout(
  slug: string,
  tipoDoLink: string | undefined,
): Promise<{ tipos: TipoGuOption[]; selecionado: string | null }> {
  try {
    const [publicos, inscritos] = await Promise.all([listarTiposPublicos(slug), contarInscritosPorTipo(slug)])
    const hoje = hojeBRT()
    const doLink = tipoDoLink ? await getTipo(slug, tipoDoLink) : null
    const link = aplicarTipoDoLink(publicos, tipoDoLink, doLink, hoje, inscritos[doLink?.tipo_id ?? ''] ?? 0)
    return {
      selecionado: link.selecionado,
      tipos: link.tipos.map((t) => {
        const p = precosDoTipo(t)
        const disp = disponibilidadeDoTipo(t, hoje, inscritos[t.tipo_id] ?? 0)
        return {
          tipo_id: t.tipo_id,
          nome: t.nome,
          descricao: t.descricao,
          gratuito: ehGratuito(t),
          precoPixReais: p.precoPixReais,
          precoCartaoBaseReais: p.precoCartaoBaseReais,
          maxParcelas: p.maxParcelas,
          vendasAte: t.vendas_ate ? dataBR(t.vendas_ate) : null,
          disponivel: disp.disponivel,
          motivo: disp.motivo,
        }
      }),
    }
  } catch {
    return { tipos: [], selecionado: null }
  }
}
