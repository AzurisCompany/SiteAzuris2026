import type { Metadata } from 'next'
import { dssMetadata } from '../../metadata'
import CertificadoCheckout from '../CertificadoCheckout'

// Upgrade Elite — slides das palestras do DSS 2026 (R$ 30). Link direto, fora do índice.
export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/certificado-elite/slides',
  title: 'Upgrade Elite — slides · DSS 2026',
  description: 'Slides das palestras do Data Science Summit Brasil 2026 por R$ 30, no PIX ou no cartão.',
  noindex: true,
})

export default function SlidesElitePage() {
  return <CertificadoCheckout formato="slides" />
}
