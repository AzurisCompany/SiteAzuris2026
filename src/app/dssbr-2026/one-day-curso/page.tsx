import type { Metadata } from 'next'
import { getProduto } from '@/lib/produtos'
import PasseCheckout from '../PasseCheckout'
import { dssMetadata } from '../metadata'

// Combo (cross-sell): One Day + acesso ao portal do curso "Lakehouse: Pipeline na
// Prática". Preço fixo R$360, sem lote/âncora. Fulfillment do curso é MANUAL (a
// compra registra a inscrição; liberar o portal é passo operacional do Binhara).
const PRODUTO = getProduto('dss-one-day-curso-2026')

const INCLUI = [
  '1 dia de evento (One Day)',
  'Plenária Principal · Auditório Secundário · Área de exposição',
  'Coffee Break',
  'Acesso ao portal do curso "Lakehouse: Pipeline na Prática" (conteúdo on-demand)',
]

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/one-day-curso',
  title: 'One Day + Portal do Curso — DSS 2026 · Data Science Summit Brasil',
  description:
    'Combo do DSS 2026: passe de 1 dia + acesso ao portal do curso Lakehouse: Pipeline na Prática por R$ 360. PIX ou cartão em até 3x.',
  noindex: true, // página de checkout, sem indexação — mas com card do congresso no WhatsApp
})

export const dynamic = 'force-dynamic'

export default function OneDayCursoPage() {
  return (
    <PasseCheckout
      produto={PRODUTO}
      endpoint="/api/dss-one-day-curso/inscricao"
      gaItem={{ id: 'dss-one-day-curso-2026', name: 'DSS 2026 — One Day + Portal do Curso' }}
      h1={
        <>
          One Day <span className="text-[var(--azuris-cyan)]">+ Curso Pipeline</span>
        </>
      }
      subtitulo={
        <>
          <strong className="text-[var(--text-primary)]">1 dia de evento + o portal do curso</strong> Lakehouse:
          Pipeline na Prática. Inscrição individual.
        </>
      }
      resumoLabel="Combo · One Day + Portal do Curso"
      inclui={INCLUI}
      waContexto="Oi! Estava no checkout do combo One Day + Curso Pipeline (DSS 2026) e quero saber sobre os pacotes para grupos / compras corporativas."
      notaValor={
        <>
          Leva o One Day <strong className="text-[var(--text-primary)]">e</strong> o portal do curso de dados por um
          preço só.
        </>
      }
    />
  )
}
