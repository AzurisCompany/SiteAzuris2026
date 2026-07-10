// Reconciliação de caixa: bate o SALDO real da conta Asaas contra o LÍQUIDO
// RECEBIDO que o banco acumula. São métricas diferentes por natureza —
//   saldo  = caixa disponível agora (já embute saque, antecipação, taxa)
//   líquido = receita líquida acumulada de vendas marcadas 'paid'
// O extrato do Asaas explica a diferença item a item. Ver /admin/saude.
import { getBalance, getFinanceTransactions, type AsaasFinanceTransaction } from '@/lib/asaas'
import { totalLiquidoRecebido } from '@/lib/admin-queries'

export type GrupoExtrato = 'recebimento' | 'antecipacao' | 'taxa' | 'saque' | 'estorno' | 'outro'

const GRUPO_LABEL: Record<GrupoExtrato, string> = {
  recebimento: 'Recebimentos',
  antecipacao: 'Antecipações',
  taxa: 'Taxas',
  saque: 'Saques / transferências',
  estorno: 'Estornos',
  outro: 'Outros',
}

/** Classifica o `type` cru do extrato do Asaas num grupo amigável. */
export function grupoDaTransacao(type: string): GrupoExtrato {
  const t = type.toUpperCase()
  if (t.includes('FEE')) return 'taxa'
  if (t.includes('ANTICIPATION')) return 'antecipacao'
  if (t.includes('REFUND') || t.includes('REVERSAL') || t.includes('CHARGEBACK')) return 'estorno'
  if (t.includes('TRANSFER') || t.includes('WITHDRAW')) return 'saque'
  if (t.includes('RECEIVED') || t.includes('PAYMENT')) return 'recebimento'
  return 'outro'
}

export function labelGrupo(g: GrupoExtrato): string {
  return GRUPO_LABEL[g]
}

export interface ResumoGrupo {
  grupo: GrupoExtrato
  qtde: number
  totalCentavos: number // sinalizado: crédito > 0, débito < 0
}

export interface Reconciliacao {
  saldoAsaasCentavos: number // caixa disponível agora
  liquidoBancoCentavos: number // "Líquido recebido" do dash
  brutoBancoCentavos: number
  pagasBanco: number
  diferencaCentavos: number // saldo − líquido (positivo = tem mais caixa que receita reconhecida)
  gruposExtrato: ResumoGrupo[] // extrato recente agrupado por tipo
  transacoes: AsaasFinanceTransaction[] // extrato recente cru (mais novas primeiro)
  totalTransacoes: number
  janela: number // quantas transações a janela puxou
}

const reais2cent = (v: number) => Math.round(v * 100)

/** Monta a reconciliação. As chamadas ao Asaas podem lançar (rede/chave) — quem
 *  chama deve envolver em try/catch e mostrar estado de erro isolado. */
export async function reconciliacaoCaixa(janela = 60): Promise<Reconciliacao> {
  const [{ balanceReais }, extrato, banco] = await Promise.all([
    getBalance(),
    getFinanceTransactions(janela, 0),
    totalLiquidoRecebido(),
  ])

  const acc = new Map<GrupoExtrato, ResumoGrupo>()
  for (const t of extrato.transactions) {
    const g = grupoDaTransacao(t.type)
    const cur = acc.get(g) ?? { grupo: g, qtde: 0, totalCentavos: 0 }
    cur.qtde += 1
    cur.totalCentavos += reais2cent(t.value)
    acc.set(g, cur)
  }
  const ordem: GrupoExtrato[] = ['recebimento', 'antecipacao', 'taxa', 'saque', 'estorno', 'outro']
  const gruposExtrato = ordem.map((g) => acc.get(g)).filter((x): x is ResumoGrupo => x != null)

  const saldoAsaasCentavos = reais2cent(balanceReais)
  return {
    saldoAsaasCentavos,
    liquidoBancoCentavos: banco.liquido,
    brutoBancoCentavos: banco.bruto,
    pagasBanco: banco.pagas,
    diferencaCentavos: saldoAsaasCentavos - banco.liquido,
    gruposExtrato,
    transacoes: extrato.transactions,
    totalTransacoes: extrato.totalCount,
    janela,
  }
}
