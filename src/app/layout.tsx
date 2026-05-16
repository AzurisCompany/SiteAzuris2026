import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";

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
    default: "Azuris — Engenharia de Dados e IA",
    template: "%s · Azuris",
  },
  description:
    "20+ anos transformando dados em vantagem competitiva. Lakehouse, pipelines, IA em produção. Da nuvem ao modelo.",
  metadataBase: new URL("https://azuris.com.br"),
  openGraph: {
    title: "Azuris — Engenharia de Dados e IA",
    description:
      "20+ anos transformando dados em vantagem competitiva. Lakehouse, pipelines, IA em produção.",
    type: "website",
    locale: "pt_BR",
    siteName: "Azuris",
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
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
