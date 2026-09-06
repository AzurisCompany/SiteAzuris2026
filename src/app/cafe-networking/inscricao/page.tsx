import type { Metadata } from 'next'
import { carregarTiposCheckout } from '@/lib/eventos/carregar'
import PaginaCheckoutEvento from '@/components/evento/PaginaCheckoutEvento'
import { EVENTO_CAFE, MARCA_CAFE } from '../evento'

// Checkout do café de networking. Layout no `PaginaCheckoutEvento` compartilhado
// ([[eventos/tipos]]); qual edição está em cartaz é decisão de ../evento.ts.

export const metadata: Metadata = {
  title: `Inscrição — Café da Manhã de Networking do DSSBR · ${EVENTO_CAFE.dataCurta}`,
  description: EVENTO_CAFE.checkoutDescricao,
  robots: { index: false, follow: false }, // checkout; a página do evento é a indexável
}

export const dynamic = 'force-dynamic'

export default async function InscricaoCafePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  // `?tipo=` pode apontar pra um ingresso oculto (fora da vitrine) — ver [[tipos-ingresso]].
  const { tipos, selecionado } = await carregarTiposCheckout(EVENTO_CAFE.slug, sp.tipo)
  return <PaginaCheckoutEvento evento={EVENTO_CAFE} marca={MARCA_CAFE} tipos={tipos} tipoPre={selecionado} />
}
