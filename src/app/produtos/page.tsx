import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Ecosystem } from "@/components/sections/Ecosystem";
import { Cta } from "@/components/sections/Cta";

export const metadata: Metadata = {
  title: "Produtos",
  description: "DSSBR, English Talk Time, OWorkshop, GU BigData, Curso Pipelines + IA.",
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
