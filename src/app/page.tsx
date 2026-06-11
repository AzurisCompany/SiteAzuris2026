import { Navbar } from "@/components/Navbar";
import { AzurizBanner } from "@/components/AzurizBanner";
import { Hero } from "@/components/sections/Hero";
import { Ecosystem } from "@/components/sections/Ecosystem";
import { Cases } from "@/components/sections/Cases";
import { Partners } from "@/components/sections/Partners";
import { Stack } from "@/components/sections/Stack";
import { HowWeWork } from "@/components/sections/HowWeWork";
import { Cta } from "@/components/sections/Cta";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <AzurizBanner />
      <main className="flex-1">
        <Hero />
        {/* Divulgação do curso Lakehouse — seção simples, mesmo padrão das demais */}
        <section className="relative py-16 md:py-20 bg-deep/40">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Curso · turma de lançamento · Lote 1 aberto
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-3xl">
              Lakehouse: Pipeline na Prática — do zero ao dashboard em 5 semanas
            </h2>
            <p className="mt-4 text-lg text-foam/60 max-w-2xl">
              Aulas ao vivo construindo um pipeline completo com MinIO, Apache Iceberg,
              Spark, Airflow e Superset. <strong className="text-foam">R$ 550</strong> —
              Pix à vista R$ 522,50 (5% off) ou até 5x no cartão — com ingresso do DSSBR
              2026 incluso.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="/lakehouse-comunidade/inscricao?utm_source=home&utm_medium=secao&utm_campaign=lakehouse-t1-l1"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-brand px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-mist"
              >
                Garantir vaga →
              </a>
              <a
                href="/lakehouse-comunidade/"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-brand/40 bg-cyan-brand/10 px-6 py-3 text-sm font-semibold text-cyan-brand transition-colors hover:bg-cyan-brand/20"
              >
                Conhecer o curso
              </a>
            </div>
          </div>
        </section>
        <Ecosystem />
        <Cases />
        <Partners />
        <Stack />
        <HowWeWork />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
