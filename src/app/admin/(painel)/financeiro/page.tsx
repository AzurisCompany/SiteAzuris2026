import {
  recebiveisPorVencimento,
  vendasPorDia,
  faturamentoMensal,
  brl,
  type RecebivelBucket,
  type FaturamentoMes,
} from '@/lib/admin-queries'
import { getConfigsFinanceiro } from '@/lib/db'
import { hojeBRT } from '@/lib/format'
import GraficoVendas from './GraficoVendas'
import ConfigNumero from './ConfigNumero'
import ConfigTexto from './ConfigTexto'

export const dynamic = 'force-dynamic'

const BUCKETS: Array<{ chave: RecebivelBucket['bucket']; rotulo: string; alerta?: boolean }> = [
  { chave: 'vencido', rotulo: 'Vencido', alerta: true },
  { chave: 'hoje', rotulo: 'Vence hoje' },
  { chave: '7d', rotulo: 'Próx. 7 dias' },
  { chave: '30d', rotulo: 'Próx. 30 dias' },
  { chave: 'depois', rotulo: 'Depois' },
  { chave: 'sem_venc', rotulo: 'Sem vencimento' },
]

function mesLabel(mes: string): string {
  const [y, m] = mes.split('-')
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${nomes[Number(m) - 1] ?? m}/${y.slice(2)}`
}

export default async function FinanceiroPage() {
  let recebiveis: RecebivelBucket[] = []
  let serie: { dia: string; bruto: number; qtde: number }[] = []
  let meses: FaturamentoMes[] = []
  let config: Record<string, string> = {}
  let erro: string | null = null
  try {
    ;[recebiveis, serie, meses, config] = await Promise.all([
      recebiveisPorVencimento(),
      vendasPorDia(30),
      faturamentoMensal(12),
      getConfigsFinanceiro(),
    ])
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro ao consultar o banco.'
  }

  const metaCentavos = Number(config.meta_mensal_centavos ?? 0)
  const aliquotaPct = Number(config.aliquota_imposto_pct ?? 0)

  // Recebíveis → mapa por bucket.
  const recMap = new Map(recebiveis.map((r) => [r.bucket, r]))
  const totalReceber = recebiveis.reduce((a, r) => a + r.bruto, 0)

  // Série densa dos últimos 30 dias (preenche zeros), ancorada em BRT — casa com o
  // date_trunc AT TIME ZONE 'America/Sao_Paulo' de vendasPorDia.
  const porDia = new Map(serie.map((p) => [p.dia, p]))
  const baseBRT = new Date(`${hojeBRT()}T12:00:00Z`)
  const denso: { dia: string; bruto: number; qtde: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(baseBRT)
    d.setUTCDate(baseBRT.getUTCDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const p = porDia.get(iso)
    denso.push({ dia: iso, bruto: p?.bruto ?? 0, qtde: p?.qtde ?? 0 })
  }

  // Meta do mês corrente (BRT).
  const mesAtual = hojeBRT().slice(0, 7)
  const fatAtual = meses.find((m) => m.mes === mesAtual)
  const brutoMes = fatAtual?.bruto ?? 0
  const progresso = metaCentavos > 0 ? Math.min(100, Math.round((brutoMes / metaCentavos) * 100)) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Recebíveis, evolução de vendas e fechamento mensal.</p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Falha ao carregar: {erro}
        </div>
      )}

      {/* --- Recebíveis por vencimento --- */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-bold">A receber por vencimento</h2>
          <span className="text-sm text-[var(--text-muted)]">total pendente {brl(totalReceber)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {BUCKETS.map((b) => {
            const r = recMap.get(b.chave)
            const bruto = r?.bruto ?? 0
            const qtde = r?.qtde ?? 0
            return (
              <div
                key={b.chave}
                className={`rounded-xl border p-4 ${
                  b.alerta && bruto > 0
                    ? 'border-orange-400/40 bg-orange-400/5'
                    : 'border-[var(--azuris-surface)] bg-[var(--azuris-deep)]'
                }`}
              >
                <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{b.rotulo}</div>
                <div className={`mt-1 text-lg font-black ${b.alerta && bruto > 0 ? 'text-orange-400' : ''}`}>{brl(bruto)}</div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">{qtde} cobrança(s)</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* --- Evolução + meta --- */}
      <section className="space-y-4 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-bold">Vendas pagas — últimos 30 dias</h2>
          <ConfigNumero
            chave="meta_mensal_centavos"
            rotulo="Meta do mês"
            unidade="reais"
            valorAtual={metaCentavos}
            dica="barra abaixo"
          />
        </div>

        {metaCentavos > 0 && (
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">
                {mesLabel(mesAtual)}: <strong className="text-[var(--text-primary)]">{brl(brutoMes)}</strong> de {brl(metaCentavos)}
              </span>
              <span className="font-bold text-[var(--accent-emerald)]">{progresso}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--azuris-surface)]">
              <div className="h-full rounded-full bg-[var(--accent-emerald)]" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        )}

        <GraficoVendas dados={denso} />
      </section>

      {/* --- Fechamento mensal / DRE --- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Fechamento mensal</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Líquido pós-imposto = bruto − taxa Asaas − imposto estimado. {aliquotaPct === 0 && 'Defina a alíquota pra ver o imposto.'}
            </p>
          </div>
          <ConfigNumero
            chave="aliquota_imposto_pct"
            rotulo="Alíquota imposto"
            unidade="pct"
            valorAtual={aliquotaPct}
            dica="sobre o bruto"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--azuris-surface)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--azuris-deep)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Mês</th>
                <th className="px-4 py-3 text-right">Pagas</th>
                <th className="px-4 py-3 text-right">Bruto</th>
                <th className="px-4 py-3 text-right">Taxa Asaas</th>
                <th className="px-4 py-3 text-right">Imposto est.</th>
                <th className="px-4 py-3 text-right">Líquido pós-imposto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--azuris-surface)]">
              {meses.map((m) => {
                const imposto = Math.round((m.bruto * aliquotaPct) / 100)
                const liquidoPos = m.bruto - m.taxa - imposto
                return (
                  <tr key={m.mes} className="hover:bg-[var(--azuris-deep)]/50">
                    <td className="px-4 py-3 font-medium">{mesLabel(m.mes)}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)]">{m.qtde}</td>
                    <td className="px-4 py-3 text-right">{brl(m.bruto)}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-muted)]">−{brl(m.taxa)}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-muted)]">{imposto > 0 ? `−${brl(imposto)}` : '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--accent-emerald)]">{brl(liquidoPos)}</td>
                  </tr>
                )
              })}
              {meses.length === 0 && !erro && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                    Nenhum pagamento registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- Config da Nota Fiscal (Asaas) --- */}
      <section className="space-y-4 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-5">
        <div>
          <h2 className="text-lg font-bold">Nota Fiscal (Asaas)</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Usado ao emitir NFS-e numa venda paga (aba da venda). Requer os dados fiscais preenchidos na sua conta Asaas
            (inscrição municipal, serviço, regime).
          </p>
        </div>
        <ConfigTexto
          chave="nf_servico_descricao"
          rotulo="Descrição do serviço"
          valorAtual={config.nf_servico_descricao ?? ''}
          placeholder="Ex.: Serviços de treinamento e consultoria em engenharia de dados"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ConfigTexto
            chave="nf_municipal_service_code"
            rotulo="Cód. serviço municipal (opcional)"
            valorAtual={config.nf_municipal_service_code ?? ''}
            placeholder="depende do município"
          />
          <ConfigTexto
            chave="nf_municipal_service_name"
            rotulo="Nome serviço municipal (opcional)"
            valorAtual={config.nf_municipal_service_name ?? ''}
            placeholder="depende do município"
          />
        </div>
      </section>
    </div>
  )
}
