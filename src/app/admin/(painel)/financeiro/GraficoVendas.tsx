// Gráfico de barras da série de vendas pagas por dia. Série ÚNICA (magnitude no
// tempo) → uma cor (emerald = dinheiro recebido), sem legenda (o título nomeia a
// série), tooltip nativo via <title>, sem JS de cliente. Marcas finas, topo
// arredondado ancorado na baseline, eixos recessivos.
interface Ponto {
  dia: string // YYYY-MM-DD
  bruto: number // centavos
  qtde: number
}

const reais0 = (c: number) =>
  (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function ddmm(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default function GraficoVendas({ dados }: { dados: Ponto[] }) {
  const n = dados.length
  const padL = 46
  const padR = 12
  const padT = 18
  const padB = 22
  const step = 18
  const barW = step - 3 // 3px de respiro entre barras (baseline compartilhada)
  const innerH = 150
  const chartW = padL + padR + n * step
  const chartH = padT + innerH + padB
  const baseline = padT + innerH

  const max = Math.max(...dados.map((p) => p.bruto), 1)
  const idxMax = dados.reduce((mi, p, i) => (p.bruto > dados[mi].bruto ? i : mi), 0)

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="h-auto w-full"
        role="img"
        aria-label="Vendas pagas por dia nos últimos 30 dias"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* baseline + topo (grid recessivo) */}
        <line x1={padL} y1={baseline} x2={chartW - padR} y2={baseline} stroke="var(--azuris-surface)" strokeWidth={1} />
        <line x1={padL} y1={padT} x2={chartW - padR} y2={padT} stroke="var(--azuris-surface)" strokeWidth={1} strokeDasharray="2 4" opacity={0.5} />

        {/* rótulo do topo do eixo Y (máximo) */}
        <text x={padL - 6} y={padT + 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">
          {reais0(max)}
        </text>
        <text x={padL - 6} y={baseline} textAnchor="end" fontSize={10} fill="var(--text-muted)">
          0
        </text>

        {dados.map((p, i) => {
          const h = (p.bruto / max) * innerH
          const x = padL + i * step + (step - barW) / 2
          const y = baseline - h
          const mostrarData = i % 7 === 0 || i === n - 1
          return (
            <g key={p.dia}>
              {p.bruto > 0 && (
                <rect x={x} y={y} width={barW} height={h} rx={2} fill="var(--accent-emerald)">
                  <title>{`${ddmm(p.dia)}: ${reais0(p.bruto)} · ${p.qtde} venda(s)`}</title>
                </rect>
              )}
              {/* rótulo direto só na maior barra */}
              {i === idxMax && p.bruto > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--accent-emerald)">
                  {reais0(p.bruto)}
                </text>
              )}
              {mostrarData && (
                <text x={x + barW / 2} y={baseline + 14} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
                  {ddmm(p.dia)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
