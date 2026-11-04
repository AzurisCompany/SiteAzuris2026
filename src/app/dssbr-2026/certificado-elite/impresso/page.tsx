import type { Metadata } from 'next'
import { dssMetadata } from '../../metadata'
import CertificadoCheckout from '../CertificadoCheckout'

// Upgrade Elite — certificado impresso do DSS 2026 (R$ 50). Link direto, fora do índice.
export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/certificado-elite/impresso',
  title: 'Upgrade Elite — certificado impresso · DSS 2026',
  description: 'Certificado impresso do Data Science Summit Brasil 2026 por R$ 50, no PIX ou no cartão.',
  noindex: true,
})

export default function CertificadoEliteImpressoPage() {
  return <CertificadoCheckout formato="impresso" />
}
