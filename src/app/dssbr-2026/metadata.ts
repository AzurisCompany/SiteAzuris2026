import type { Metadata } from 'next'

// Dados canônicos do congresso para o preview de link (Open Graph / Twitter Card).
// Sem um openGraph próprio, cada página do DSS herda o og:title/imagem/siteName do
// root layout (Azuris) — e o link no WhatsApp aparece com a cara da Azuris, não do
// congresso. Este helper carimba o nome, a URL e a imagem do DSS em todas elas.
export const DSS_SITE_NAME = 'Data Science Summit Brasil'
const SITE = 'https://azuris.com.br'
const DSS_OG_IMAGE = 'https://dssbr.com.br/assets/photos/dss2025-012.jpg'

export function dssMetadata({
  path,
  title,
  description,
  ogDescription,
  image = DSS_OG_IMAGE,
  noindex = false,
}: {
  /** Caminho absoluto da própria página, ex.: '/dssbr-2026/one-day'. */
  path: string
  title: string
  description: string
  /** Descrição curta só para o card social (default: `description`). */
  ogDescription?: string
  image?: string
  /** Páginas de checkout: fora do índice, mas ainda com card do congresso. */
  noindex?: boolean
}): Metadata {
  const url = `${SITE}${path}`
  const social = ogDescription ?? description
  return {
    // `absolute` ignora o template "%s · Azuris" do root — título limpo do congresso.
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: social,
      url,
      siteName: DSS_SITE_NAME,
      images: [image],
      type: 'website',
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: social,
      images: [image],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
