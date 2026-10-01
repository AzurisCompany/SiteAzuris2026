import type { Metadata } from 'next'
import { getProduto } from '@/lib/produtos'
import PasseCheckout from '../PasseCheckout'
import { dssMetadata } from '../metadata'

// Combo vigente (cross-sell): FullPass (3 dias) + acesso ao portal do curso
// "Lakehouse: Pipeline na Prática". Preço fixo R$850, sem lote/âncora. Substituiu o
// combo One Day + curso (R$360), encerrado em 25/08/2026. Fulfillment do curso é
// MANUAL (a compra registra a inscrição; liberar o portal é passo operacional).
const PRODUTO = getProduto('dss-fullpass-curso-2026')

const INCLUI = [
  'Acesso aos 3 dias de evento (FullPass)',
  'Workshops hands-on, keynotes e tracks',
  'Rodada de negócios e networking',
  'Acesso ao portal do curso "Lakehouse: Pipeline na Prática" (conteúdo on-demand)',
]

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/fullpass-curso',
  title: 'FullPass + Portal do Curso — DSS 2026 · Data Science Summit Brasil',
  description:
    'Combo do DSS 2026: FullPass dos 3 dias + acesso ao portal do curso Lakehouse: Pipeline na Prática por R$ 850. PIX ou cartão em até 3x.',
  noindex: true, // página de checkout, sem indexação — mas com card do congresso no WhatsApp
})

export const dynamic = 'force-dynamic'

export default async function FullPassCursoPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; c?: string }>
}) {
  return (
    <PasseCheckout
      cupomEntrada={await searchParams}
      produto={PRODUTO}
      endpoint="/api/dss-fullpass-curso/inscricao"
      gaItem={{ id: 'dss-fullpass-curso-2026', name: 'DSS 2026 — FullPass + Portal do Curso' }}
      h1={
        <>
          FullPass <span className="text-[var(--azuris-cyan)]">+ Curso Pipeline</span>
        </>
      }
      subtitulo={
        <>
          <strong className="text-[var(--text-primary)]">Os 3 dias de evento + o portal do curso</strong> Lakehouse:
          Pipeline na Prática. Inscrição individual.
        </>
      }
      resumoLabel="Combo · FullPass + Portal do Curso"
      inclui={INCLUI}
      waContexto="Oi! Estava no checkout do combo FullPass + Curso Pipeline (DSS 2026) e quero saber sobre os pacotes para grupos / compras corporativas."
      notaValor={
        <>
          O FullPass sozinho sai por{' '}
          <strong className="text-[var(--text-primary)]">R$&nbsp;887</strong> — no combo, com o portal do curso junto, fica R$ 850.
        </>
      }
    />
  )
}
