import type { Metadata } from 'next'
import { getProduto } from '@/lib/produtos'
import PasseCheckout from '../PasseCheckout'
import { dssMetadata } from '../metadata'
import { LOTES_ONE_DAY, LOTE_ONEDAY_ATUAL } from './lotes'

// Passe One Day — 1 dia do DSS 2026. Lote gerido no preço do registry (sem tipos):
// vende o Lote 3 (R$357), o último, sem âncora. Corpo do checkout
// vem do PasseCheckout compartilhado; aqui só a config específica do produto.
// A escada (e o nome do lote em cartaz) vem de ./lotes — a landing lê o mesmo módulo.
const PRODUTO = getProduto('dss-one-day-2026')

const INCLUI = ['1 dia de evento', 'Plenária Principal', 'Auditório Secundário', 'Área de exposição', 'Coffee Break']

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/one-day',
  title: 'Passe One Day — DSS 2026 · Data Science Summit Brasil',
  description:
    'Passe de 1 dia do DSS 2026 (27–29 de outubro, IEP Curitiba). Lote 3 por R$ 357 no PIX ou cartão em até 3x.',
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
      resumoLabel={`${LOTE_ONEDAY_ATUAL.nome} · a partir de`}
      lotes={LOTES_ONE_DAY}
      inclui={INCLUI}
      waContexto="Oi! Estava no checkout do Passe One Day (DSS 2026) e quero saber sobre os pacotes para grupos / compras corporativas."
    />
  )
}
