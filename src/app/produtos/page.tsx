import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Ecosystem } from "@/components/sections/Ecosystem";
import { Cta } from "@/components/sections/Cta";

export const metadata: Metadata = {
  title: "Produtos — Cursos, Workshops e Conferência Azuris",
  description:
    "Ecossistema Azuris: Curso Pipelines de Dados + IA, Workshop de IA para Gestores (OWorkshop), Conferência DSSBR, English Talk Time e portal Hadoop.com.br.",
  keywords: [
    "curso engenharia de dados",
    "curso pipelines de dados",
    "workshop IA gestores",
    "OWorkshop",
    "DSSBR",
    "conferência dados Brasil",
    "treinamento corporativo Big Data",
  ],
  openGraph: {
    title: "Produtos — Cursos, Workshops e Conferência Azuris",
    description:
      "Cursos de engenharia de dados, workshops de IA para gestores e conferência DSSBR.",
    type: "website",
  },
  alternates: { canonical: "/produtos" },
};

export default function ProdutosPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <PageHeader
          eyebrow="Ecossistema"
          size="md"
          title="Produtos da casa."
          intro={
            <p>
              Conferência, treinamentos, comunidade, produto. Cada um responde
              uma pergunta diferente do mercado de dados.
            </p>
          }
        />
        <Ecosystem />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
