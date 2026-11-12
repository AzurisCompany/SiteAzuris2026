import type { Metadata } from 'next'
import { dssMetadata } from '../metadata'
import CertificadoCheckout from '../certificado-elite/CertificadoCheckout'

// Upgrade de vídeos do DSS 2026 (R$ 50): download das gravações das palestras, pra qualquer
// tipo de ingresso — não é parte do Upgrade Elite. Link direto, fora do índice.
export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/upgrade-videos',
  title: 'Upgrade vídeos · DSS 2026',
  description: 'Download das gravações das palestras do Data Science Summit Brasil 2026 por R$ 50, no PIX ou no cartão.',
  noindex: true,
})

export default function UpgradeVideosPage() {
  return <CertificadoCheckout formato="videos" />
}
