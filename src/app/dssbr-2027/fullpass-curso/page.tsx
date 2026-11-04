import type { Metadata } from 'next'
import { getProduto } from '@/lib/produtos'
import { PRECO_POR_PERFIL } from '@/lib/db'
import PasseCheckout from '../../dssbr-2026/PasseCheckout'
import { dssMetadata } from '../../dssbr-2026/metadata'

// COMBO DSS 2027: FullPass + vaga na nova turma do curso "Lakehouse: Pipeline na Prática",
// R$755. Retomada do combo FullPass + curso do DSS 2026 (R$850, encerrado em 08/10).
// Sem data/local do 2027 e sem data de turma — nenhum dos dois está definido.
// Fulfillment do curso é MANUAL. PIX na nossa tela; aceita link de vendedora (?d=/?c=).
const PRODUTO = getProduto('dss-2027-fullpass-curso')

const PRELOAD_REAIS = getProduto('dss-2027-preload').precoCentavos / 100
const CURSO_REAIS = PRECO_POR_PERFIL['nao-membro'].preco_centavos / 100 // preço do curso sozinho

const INCLUI = [
  'FullPass do DSS 2027 — todos os dias do evento',
  'Vaga na nova turma do curso "Lakehouse: Pipeline na Prática"',
  'Data, local e grade do DSS 2027 a anunciar',
]

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2027/fullpass-curso',
  title: 'FullPass + Curso Pipeline — DSS 2027 · Data Science Summit Brasil',
  description:
    'Combo do DSS 2027: FullPass + vaga na nova turma do curso Lakehouse: Pipeline na Prática por R$ 755. PIX ou cartão em até 3x.',
  noindex: true, // página de checkout, sem indexação — mas com card do congresso no WhatsApp
})

export const dynamic = 'force-dynamic'

export default async function FullPassCurso2027Page({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; c?: string }>
}) {
  return (
    <PasseCheckout
      cupomEntrada={await searchParams}
      produto={PRODUTO}
      endpoint="/api/dss-2027-fullpass-curso/inscricao"
      pixStatusEndpoint="/api/dss-2027-fullpass-curso/status"
      gaItem={{ id: PRODUTO.slug, name: PRODUTO.nome }}
      h1={
        <>
          DSS 2027 FullPass <span className="text-[var(--azuris-cyan)]">+ Curso Pipeline</span>
        </>
      }
      subtitulo={
        <>
          <strong className="text-[var(--text-primary)]">O FullPass do DSS 2027 + a nova turma do curso</strong>{' '}
          Lakehouse: Pipeline na Prática. Inscrição individual.
        </>
      }
      resumoLabel="Combo · FullPass 2027 + Curso Pipeline"
      inclui={INCLUI}
      waContexto="Oi! Estava no checkout do combo FullPass DSS 2027 + Curso Pipeline e quero saber sobre os pacotes para grupos / compras corporativas."
      notaValor={
        <>
          Separados, o FullPass Pre-Load sai por R$&nbsp;{PRELOAD_REAIS} e o curso por R$&nbsp;{CURSO_REAIS}. No combo,{' '}
          <strong className="text-[var(--text-primary)]">os dois por R$&nbsp;{PRODUTO.precoCentavos / 100}</strong>.
        </>
      }
    />
  )
}
