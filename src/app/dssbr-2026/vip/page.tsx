import type { Metadata } from 'next'
import { getProduto } from '@/lib/produtos'
import CheckoutPorLotes from '../CheckoutPorLotes'
import { dssMetadata } from '../metadata'

// Ingresso VIP do DSS 2026: 40 ingressos em 3 lotes que viram sozinhos por quantidade
// (10 a R$957 → 15 a R$1.275 → 15 a R$1.657). Os preços e as vagas vivem nos tipos
// de ingresso (/admin/ingressos), não aqui. Benefícios: os mesmos do card VIP do
// dssbr.com.br.
const PRODUTO = getProduto('dss-vip-2026')

const INCLUI = [
  'Os 3 dias de evento (tudo do FullPass)',
  'Jantar Oficial com curadoria de mesa',
  'Roundtable C-level (20 vagas por sessão)',
  'Agenda com palestrantes',
  'Áreas VIP exclusivas',
  'Acesso a patrocinadores e big techs',
]

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/vip',
  title: 'Ingresso VIP — DSS 2026 · Data Science Summit Brasil',
  description:
    'Ingresso VIP do DSS 2026 (27–29/out, Curitiba): jantar oficial, roundtable C-level e áreas exclusivas. Apenas 40 ingressos. PIX ou cartão em até 3x.',
  noindex: true, // página de checkout, sem indexação — mas com card do congresso no WhatsApp
})

export const dynamic = 'force-dynamic'

export default function VipPage() {
  return (
    <CheckoutPorLotes
      produto={PRODUTO}
      endpoint="/api/dss-vip/inscricao"
      gaItem={{ id: 'dss-vip-2026', name: 'DSS 2026 — Ingresso VIP' }}
      h1={
        <>
          Ingresso <span className="text-[var(--azuris-cyan)]">VIP</span> · DSS 2026
        </>
      }
      subtitulo={
        <>
          <strong className="text-[var(--text-primary)]">Experiência exclusiva</strong> nos 3 dias do Data Science Summit
          Brasil. Apenas 40 ingressos. Inscrição individual.
        </>
      }
      resumoLabel="VIP · 27 a 29 de outubro · IEP, Curitiba"
      inclui={INCLUI}
      waContexto="Oi! Estava no checkout do ingresso VIP do DSS 2026 e quero falar sobre ingressos VIP."
    />
  )
}
