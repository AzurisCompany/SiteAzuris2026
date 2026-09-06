import type { Metadata } from 'next'
import { carregarTickets } from '@/lib/eventos/carregar'
import PaginaEvento from '@/components/evento/PaginaEvento'
import { EVENTO_CAFE, MARCA_CAFE } from './evento'

// Rota da edição corrente do café de networking do DSSBR. O layout inteiro é o
// `PaginaEvento` compartilhado ([[eventos/tipos]]) — aqui só mora o metadata e a
// leitura dos ingressos. Qual edição está em cartaz é decisão de ./evento.ts.

export const metadata: Metadata = {
  title: `${EVENTO_CAFE.titulo} | DSSBR`,
  description: EVENTO_CAFE.metaDescricao,
  openGraph: {
    title: EVENTO_CAFE.titulo,
    description: `${EVENTO_CAFE.tema} — ${EVENTO_CAFE.dataCurta}, ${EVENTO_CAFE.horario}, ${EVENTO_CAFE.local.sigla} Curitiba.`,
    type: 'website',
    images: [{ url: EVENTO_CAFE.banner.src, width: EVENTO_CAFE.banner.largura, height: EVENTO_CAFE.banner.altura }],
  },
  alternates: { canonical: '/cafe-networking' },
}

export const dynamic = 'force-dynamic'

export default async function CafeNetworkingPage() {
  const tickets = await carregarTickets(EVENTO_CAFE.slug)
  return <PaginaEvento evento={EVENTO_CAFE} marca={MARCA_CAFE} tickets={tickets} />
}
