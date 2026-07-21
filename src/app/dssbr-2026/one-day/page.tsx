import type { Metadata } from 'next'
import { getProduto } from '@/lib/produtos'
import PasseCheckout from '../PasseCheckout'
import { dssMetadata } from '../metadata'

// Passe One Day — 1 dia do DSS 2026. Lote gerido no preço do registry (sem tipos):
// vende Lote 1 (R$190) com âncora do lote final (R$270) riscada. Corpo do checkout
// vem do PasseCheckout compartilhado; aqui só a config específica do produto.
const PRODUTO = getProduto('dss-one-day-2026')

// Escada de lotes só pra exibição — a fonte da verdade do preço é o registry
// (precoCentavos). Ao virar o lote, ajusta ambos: o registry e o `atual` daqui.
const LOTES = [
  { nome: 'Lote 1', valor: 190, atual: true },
  { nome: 'Lote 2', valor: 230, atual: false },
  { nome: 'Lote 3', valor: 270, atual: false },
]

const INCLUI = ['1 dia de evento', 'Plenária Principal', 'Auditório Secundário', 'Área de exposição', 'Coffee Break']

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/one-day',
  title: 'Passe One Day — DSS 2026 · Data Science Summit Brasil',
  description:
    'Passe de 1 dia do DSS 2026 (27–29 de outubro, IEP Curitiba). Lote 1 a partir de R$ 190 no PIX ou cartão em até 3x.',
  noindex: true, // página de checkout, sem indexação — mas com card do congresso no WhatsApp
})

export const dynamic = 'force-dynamic'

export default function OneDayPage() {
  return (
    <PasseCheckout
      produto={PRODUTO}
      endpoint="/api/dss-one-day/inscricao"
      gaItem={{ id: 'dss-one-day-2026', name: 'DSS 2026 — Passe One Day' }}
      h1={
        <>
          Passe <span className="text-[var(--azuris-cyan)]">One Day</span> · DSS 2026
        </>
      }
      subtitulo={
        <>
          <strong className="text-[var(--text-primary)]">1 dia de evento</strong> no Data Science Summit Brasil 2026.
          Inscrição individual.
        </>
      }
      resumoLabel="Lote 1 · a partir de"
      lotes={LOTES}
      inclui={INCLUI}
      waContexto="Oi! Estava no checkout do Passe One Day (DSS 2026) e quero saber sobre os pacotes para grupos / compras corporativas."
    />
  )
}
