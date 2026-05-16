import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog",
  description: "Insights de engenharia de dados, lakehouse, IA em produção.",
};

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-32">
        <section className="mx-auto max-w-4xl px-6">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
            Blog
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[0.95]">
            Em breve.
          </h1>
          <p className="mt-8 text-lg text-foam/60 max-w-2xl">
            Estamos preparando a estrutura MDX. Os posts existentes do site
            antigo serão migrados em breve.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
