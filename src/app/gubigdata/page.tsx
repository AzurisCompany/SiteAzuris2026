import type { Metadata } from 'next'
import { carregarTickets } from '@/lib/eventos/carregar'
import PaginaEvento from '@/components/evento/PaginaEvento'
import { EVENTO_GU, MARCA_GU } from './evento'

// Rota do encontro corrente do GU. O layout inteiro é o `PaginaEvento` compartilhado
// ([[eventos/tipos]]) — aqui só mora o metadata e a leitura dos ingressos.
// Qual encontro está em cartaz é decisão de ./evento.ts.

export const metadata: Metadata = {
  title: `${EVENTO_GU.titulo} | Eventos GU BigData & IA`,
  description: EVENTO_GU.metaDescricao,
  openGraph: {
    title: EVENTO_GU.titulo,
    description: `${EVENTO_GU.tema} — ${EVENTO_GU.dataCurta}, ${EVENTO_GU.inicio}, ${EVENTO_GU.local.sigla} Curitiba.`,
    type: 'website',
    images: [{ url: EVENTO_GU.banner.src, width: EVENTO_GU.banner.largura, height: EVENTO_GU.banner.altura }],
  },
  alternates: { canonical: '/gubigdata' },
}

export const dynamic = 'force-dynamic'

export default async function EventoGuPage() {
  const tickets = await carregarTickets(EVENTO_GU.slug)
  return <PaginaEvento evento={EVENTO_GU} marca={MARCA_GU} tickets={tickets} />
}
