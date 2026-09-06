import type { Metadata } from 'next'
import { carregarTiposCheckout } from '@/lib/eventos/carregar'
import PaginaCheckoutEvento from '@/components/evento/PaginaCheckoutEvento'
import { EVENTO_GU, MARCA_GU } from '../evento'

// Checkout do encontro corrente do GU. Layout no `PaginaCheckoutEvento` compartilhado
// ([[eventos/tipos]]); qual encontro está em cartaz é decisão de ../evento.ts.

export const metadata: Metadata = {
  title: `Inscrição — Encontro Presencial GU BigData & IA · ${EVENTO_GU.dataCurta}`,
  description: EVENTO_GU.checkoutDescricao,
  robots: { index: false, follow: false }, // página de checkout; a página do evento é a indexável
}

export const dynamic = 'force-dynamic'

export default async function InscricaoGuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  // `?tipo=` pode apontar pra um ingresso oculto (fora da vitrine) — ver [[tipos-ingresso]].
  const { tipos, selecionado } = await carregarTiposCheckout(EVENTO_GU.slug, sp.tipo)
  return <PaginaCheckoutEvento evento={EVENTO_GU} marca={MARCA_GU} tipos={tipos} tipoPre={selecionado} />
}
