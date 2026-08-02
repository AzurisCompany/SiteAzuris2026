// Vigia das vendas: olha os tipos de ingresso e avisa ANTES de o checkout fechar
// sozinho. Módulo PURO — recebe o estado, devolve os alertas; quem lê o banco e
// manda o e-mail é o cron ([[EMAIL-TRANSACIONAL-RESEND]]).
//
// Existe por causa de 30/07: os dois tipos do GU tinham `vendas_ate='2026-07-29'`,
// fecharam à meia-noite do dia do evento e o público bateu em "Vendas encerradas"
// — sem nenhum alerta pra ninguém. A regra da casa hoje é que nada expira sozinho,
// mas basta alguém digitar uma data no admin (ou uma lotação encher) pra a mesma
// armadilha voltar. Este é o sino.

import { disponibilidadeDoTipo, type TipoIngresso } from '@/lib/tipos-ingresso'

/** Quantos dias antes do fim das vendas o aviso começa a soar. */
export const DIAS_DE_AVISO = 3
/** A partir de que fração da lotação o aviso começa a soar. */
export const FRACAO_LOTACAO = 0.8
/**
 * Produto cujas vendas fecharam há mais de X dias é evento passado, não incidente
 * — sem isso o GU (encerrado de propósito) viraria e-mail todo dia pra sempre.
 */
export const DIAS_PARA_ESQUECER = 7

export type Severidade = 'critico' | 'aviso'

export interface Alerta {
  severidade: Severidade
  produtoSlug: string
  /** null quando o alerta é do produto inteiro, não de um tipo */
  tipoId: string | null
  titulo: string
  detalhe: string
}

export interface ProdutoVigiado {
  slug: string
  tipos: TipoIngresso[]
  /** inscritos (paid+pending, sem teste) por tipo_id */
  inscritos: Record<string, number>
}

/** Dias entre duas datas YYYY-MM-DD (b - a). Positivo = b no futuro. */
export function diasEntre(a: string, b: string): number {
  const ms = Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)
  return Math.round(ms / 86_400_000)
}

function fmtBR(ymd: string): string {
  const [y, m, d] = ymd.split('-')
  return y && m && d ? `${d}/${m}/${y}` : ymd
}

export function analisarVendas(produtos: ProdutoVigiado[], hoje: string): Alerta[] {
  const alertas: Alerta[] = []

  for (const p of produtos) {
    if (p.tipos.length === 0) continue

    const comDisponibilidade = p.tipos.map((t) => ({
      tipo: t,
      inscritos: p.inscritos[t.tipo_id] ?? 0,
      disp: disponibilidadeDoTipo(t, hoje, p.inscritos[t.tipo_id] ?? 0),
    }))
    const disponiveis = comDisponibilidade.filter((x) => x.disp.disponivel)

    // 1. O incidente de verdade: produto sem NENHUMA opção de compra.
    if (disponiveis.length === 0) {
      const prazos = p.tipos.map((t) => t.vendas_ate).filter((v): v is string => !!v)
      const ultimoPrazo = prazos.length > 0 ? prazos.sort().at(-1)! : null
      const fechadoHa = ultimoPrazo ? diasEntre(ultimoPrazo, hoje) : 0
      // Fechou faz tempo = evento passado; não é emergência, é história.
      if (fechadoHa <= DIAS_PARA_ESQUECER) {
        alertas.push({
          severidade: 'critico',
          produtoSlug: p.slug,
          tipoId: null,
          titulo: 'Sem opção de compra',
          detalhe:
            `Nenhum dos ${p.tipos.length} tipo(s) de ${p.slug} está disponível. ` +
            'Quem abrir o checkout vê "Vendas encerradas".',
        })
      }
      continue
    }

    // 2. Avisos sobre o que ainda está vendendo.
    for (const { tipo, inscritos, disp } of comDisponibilidade) {
      if (!disp.disponivel) continue

      if (tipo.vendas_ate) {
        const faltam = diasEntre(hoje, tipo.vendas_ate)
        if (faltam <= DIAS_DE_AVISO) {
          const ultimaOpcao = disponiveis.length === 1
          alertas.push({
            severidade: ultimaOpcao ? 'critico' : 'aviso',
            produtoSlug: p.slug,
            tipoId: tipo.tipo_id,
            titulo: faltam <= 0 ? 'Vende só até hoje' : `Vende por mais ${faltam} dia(s)`,
            detalhe:
              `"${tipo.nome}" tem prazo até ${fmtBR(tipo.vendas_ate)}.` +
              (ultimaOpcao ? ' É a ÚNICA opção ativa — quando fechar, o checkout fica sem nada pra vender.' : ''),
          })
        }
      }

      if (tipo.limite_qtd != null) {
        const restam = tipo.limite_qtd - inscritos
        if (inscritos >= tipo.limite_qtd * FRACAO_LOTACAO) {
          const ultimaOpcao = disponiveis.length === 1
          alertas.push({
            severidade: ultimaOpcao ? 'critico' : 'aviso',
            produtoSlug: p.slug,
            tipoId: tipo.tipo_id,
            titulo: `Restam ${restam} vaga(s)`,
            detalhe:
              `"${tipo.nome}" está com ${inscritos} de ${tipo.limite_qtd} vagas.` +
              (ultimaOpcao ? ' É a ÚNICA opção ativa — ao esgotar, o checkout fica sem nada pra vender.' : ''),
          })
        }
      }
    }
  }

  // Crítico primeiro: o e-mail tem que abrir pelo que dói.
  return alertas.sort((a, b) => (a.severidade === b.severidade ? 0 : a.severidade === 'critico' ? -1 : 1))
}
