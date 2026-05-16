import type { Metadata } from "next";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Cta } from "@/components/sections/Cta";
import { ArrowRight, Database, Brain, Workflow, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Curso: Pipelines de Dados e IA",
  description:
    "Do raw ao modelo em produção. Lançamento no Grupo de Estudos GU BigData.",
};

const MODULES = [
  {
    icon: Database,
    title: "Ingestão & Storage",
    text: "Object storage, Iceberg, Delta, particionamento, compactação. Da fonte ao bronze sem dor.",
  },
  {
    icon: Workflow,
    title: "Transformação",
    text: "dbt, Spark, ELT. Modelagem medallion (bronze → silver → gold) com observabilidade.",
  },
  {
    icon: Brain,
    title: "IA em produção",
    text: "Embeddings, RAG, agentes, avaliação. Da feature store ao endpoint que serve modelo.",
  },
];

export default function CursoPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <PageHeader
          size="lg"
          particleCount={2200}
          eyebrow={
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-accent bg-amber-accent/10 border border-amber-accent/30 rounded-full px-2.5 py-1">
              <Sparkles className="size-3" /> Lançamento
            </span>
          }
          title={
            <>
              Pipelines de
              <br />
              <span className="text-brand-gradient">Dados e IA</span>
            </>
          }
          intro={
            <>
              <p>
                Do raw ao modelo em produção. Sem firula, sem aula chata.
                Conteúdo preparado por quem migrou 100TB de Hadoop entre nuvens
                e construiu o primeiro motor de recomendação Hadoop do
                e-commerce brasileiro.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="https://gubigdata.com.br/grupo-de-estudos/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-md bg-cyan-brand px-6 py-3.5 text-base font-medium text-ink hover:bg-mist transition-colors"
                >
                  Entrar no grupo de estudos
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/contato"
                  className="inline-flex items-center gap-2 rounded-md border border-slate/80 bg-deep/40 backdrop-blur-sm px-6 py-3.5 text-base font-medium hover:border-cyan-brand/60 transition-all"
                >
                  Quero ser avisado
                </a>
              </div>
            </>
          }
          aside={
            <div className="relative">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate/60 bg-deep float-slow">
                <Image
                  src="/products/mockup.webp"
                  alt="Preview do curso"
                  fill
                  sizes="(min-width: 768px) 40vw, 80vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 size-32 rounded-full blur-3xl bg-cyan-brand/30 pointer-events-none" />
            </div>
          }
        />

        {/* Módulos */}
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl mb-14">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
                Trilha
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
                Da fonte ao modelo.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODULES.map((m, i) => (
                <div
                  key={m.title}
                  className="rounded-2xl border border-slate/60 bg-deep p-7"
                >
                  <m.icon className="size-7 text-cyan-brand mb-4" />
                  <div className="text-cyan-brand font-mono text-sm mb-1">
                    Módulo 0{i + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{m.title}</h3>
                  <p className="text-foam/70 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-slate/60 bg-deep p-8 md:p-10">
              <p className="text-foam/60">
                Ementa completa, vídeos prévios e preço da turma inaugural em
                breve. Por enquanto, a melhor forma de saber é estar no{" "}
                <a
                  href="https://gubigdata.com.br/grupo-de-estudos/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-brand hover:text-mist"
                >
                  Grupo de Estudos GU BigData ↗
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <Cta />
      </main>
      <Footer />
    </>
  );
}
