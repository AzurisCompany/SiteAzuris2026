import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
      <main className="flex-1 pt-32">
        <section className="mx-auto max-w-4xl px-6 mb-12">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
            Ecossistema
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[0.95]">
            Produtos da casa.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-foam/70 max-w-2xl">
            Conferência, treinamentos, comunidade, produto. Cada um responde
            uma pergunta diferente do mercado de dados.
          </p>
        </section>
        <Ecosystem />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
