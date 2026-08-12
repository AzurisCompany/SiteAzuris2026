import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { GTM_ID } from "@/lib/gtm";
import { PostHogProvider } from "@/components/PostHogProvider";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { CourseFloatingBanner } from "@/components/CourseFloatingBanner";
import {
  JsonLd,
  organizationSchema,
  websiteSchema,
  professionalServiceSchema,
} from "@/components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default:
      "Azuris — Engenharia de Dados, Lakehouse, ClickHouse e IA",
    template: "%s · Azuris",
  },
  description:
    "Consultoria de Engenharia de Dados em Curitiba: construção de Data Lake, migração para Cloud, ClickHouse, redução de custo de Big Data e capacitação corporativa em Big Data e IA. Cases reais com KPIs verificáveis.",
  keywords: [
    "Engenharia de Dados",
    "Data Lake",
    "Lakehouse",
    "Apache Iceberg",
    "Delta Lake",
    "Hadoop",
    "ClickHouse",
    "Snowflake",
    "BigQuery",
    "Migração de dados",
    "Big Data",
    "Inteligência Artificial",
    "Workshop de IA",
    "Curso de IA",
    "Consultoria de dados Brasil",
    "Curitiba",
  ],
  authors: [{ name: "Alessandro Binhara", url: "https://linkedin.com/in/binhara/" }],
  creator: "Alessandro Binhara",
  publisher: "Azuris",
  metadataBase: new URL("https://azuris.com.br"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Azuris — Engenharia de Dados, Lakehouse, ClickHouse e IA",
    description:
      "Construção de Data Lake, migração para Cloud, ClickHouse, redução de custo de Big Data e capacitação corporativa.",
    type: "website",
    locale: "pt_BR",
    siteName: "Azuris",
    url: "https://azuris.com.br",
  },
  twitter: {
    card: "summary_large_image",
    title: "Azuris — Engenharia de Dados, Lakehouse, ClickHouse e IA",
    description:
      "Consultoria de Engenharia de Dados em Curitiba. Cases reais com KPIs verificáveis.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-foam">
        {/* Google Tag Manager (noscript) — precisa ser o primeiro filho do <body> */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        {/* Google Tag Manager — container de TODAS as rotas (root layout).
            afterInteractive é a estratégia recomendada pelo Next pro GTM: o snippet
            já cria o <script async>, então subir pra beforeInteractive só atrasaria
            o first paint sem adiantar coleta. */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        {/* End Google Tag Manager */}

        {/* Google Tag (gtag.js) — GA4 via Google tag GT-NNZW5FW (propriedade da Azuris) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GT-NNZW5FW"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag("js", new Date());
gtag("set", "linker", { "domains": ["azuris.com.br"] });
gtag("config", "GT-NNZW5FW");`}
        </Script>

        <JsonLd
          data={[organizationSchema, websiteSchema, professionalServiceSchema]}
        />
        <PostHogProvider>
          {children}
          <WhatsAppFab />
          <CourseFloatingBanner />
        </PostHogProvider>
      </body>
    </html>
  );
}
