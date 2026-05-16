import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { DataFlowHero } from "@/components/three/DataFlowHero";
import { AzurisMark } from "@/components/AzurisMark";

export function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] flex items-center overflow-hidden">
      <DataFlowHero />

      {/* Watermark — "A" gigante animado, opacidade baixa, vira motif visual da home */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-1/2 -translate-y-1/2 hidden lg:block"
      >
        <AzurisMark
          style={{ width: 760, height: 530 }}
          className="opacity-[0.08] float-slow"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-32 pb-24 w-full">
        {/* Eyebrow — sem repetir logo, só o selo da categoria */}
        <div className="flex items-center gap-2 mb-8 text-xs uppercase tracking-[0.18em] text-cyan-brand/90">
          <span className="relative inline-flex size-2 rounded-full bg-cyan-brand pulse-ring" />
          Azuris · Data Engineering & AI
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight max-w-5xl leading-[0.95]">
          Dados em movimento.
          <br />
          <span className="text-brand-gradient">Decisões em alta resolução.</span>
        </h1>

        <p className="mt-8 max-w-2xl text-lg md:text-xl text-foam/70 leading-relaxed">
          20+ anos transformando dados em vantagem competitiva. Lakehouse,
          pipelines em produção, modelos de IA que entregam — não slides.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/cases"
            className="group inline-flex items-center gap-2 rounded-md bg-cyan-brand px-6 py-3.5 text-base font-medium text-ink hover:bg-mist transition-colors"
          >
            Ver cases
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/contato"
            className="inline-flex items-center gap-2 rounded-md border border-slate/80 bg-deep/40 backdrop-blur-sm px-6 py-3.5 text-base font-medium hover:border-cyan-brand/60 hover:bg-deep transition-all"
          >
            Falar com a equipe
          </Link>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-foam/40">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-cyan-brand" /> RD Station ·
            Buscapé · Sicredi · Logcomex · Unimed
          </span>
        </div>
      </div>
    </section>
  );
}
