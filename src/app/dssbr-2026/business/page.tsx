import type { Metadata } from 'next'
import { getProduto } from '@/lib/produtos'
import CheckoutPorLotes from '../CheckoutPorLotes'
import { dssMetadata } from '../metadata'

// Ingresso Business do DSS 2026: 30 ingressos em 3 lotes que viram sozinhos por
// quantidade (10 a R$757 → 10 a R$984 → 10 a R$1.279). Os preços e as vagas vivem nos
// tipos de ingresso (/admin/ingressos), não aqui. Benefícios: os mesmos do card
// Business do dssbr.com.br.
const PRODUTO = getProduto('dss-business-2026')

const INCLUI = [
  'Os 3 dias de evento (tudo do FullPass)',
  'Coffee Break Premium',
  'Agenda com expositores e patrocinadores',
  'Área de coworking',
  'Acervo pós-evento (slides)',
]

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/business',
  title: 'Ingresso Business — DSS 2026 · Data Science Summit Brasil',
  description:
    'Ingresso Business do DSS 2026 (27–29/out, Curitiba): coffee break premium, coworking e agenda com expositores. PIX ou cartão em até 3x.',
  noindex: true, // página de checkout, sem indexação — mas com card do congresso no WhatsApp
})

export const dynamic = 'force-dynamic'

export default function BusinessPage() {
  return (
    <CheckoutPorLotes
      produto={PRODUTO}
      endpoint="/api/dss-business/inscricao"
      gaItem={{ id: 'dss-business-2026', name: 'DSS 2026 — Ingresso Business' }}
      h1={
        <>
          Ingresso <span className="text-[var(--azuris-cyan)]">Business</span> · DSS 2026
        </>
      }
      subtitulo={
        <>
          <strong className="text-[var(--text-primary)]">Experiência premium</strong> nos 3 dias do Data Science Summit
          Brasil. Inscrição individual.
        </>
      }
      resumoLabel="Business · 27 a 29 de outubro · IEP, Curitiba"
      inclui={INCLUI}
      waContexto="Oi! Estava no checkout do ingresso Business do DSS 2026 e quero falar sobre ingressos Business."
    />
  )
}
