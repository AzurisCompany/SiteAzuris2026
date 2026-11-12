import type { Metadata } from 'next'
import { dssMetadata } from '../../metadata'
import CertificadoCheckout from '../CertificadoCheckout'

// Upgrade Elite — vídeos das palestras do DSS 2026 (R$ 50). Link direto, fora do índice.
export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/certificado-elite/videos',
  title: 'Upgrade Elite — vídeos · DSS 2026',
  description: 'Gravações das palestras do Data Science Summit Brasil 2026 por R$ 50, no PIX ou no cartão.',
  noindex: true,
})

export default function VideosElitePage() {
  return <CertificadoCheckout formato="videos" />
}
