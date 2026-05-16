import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Cta() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[420px] blur-[120px] opacity-50 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 50%, #14b7de 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          Pronto para colocar
          <br />
          <span className="text-brand-gradient">dados em produção?</span>
        </h2>
        <p className="mt-6 text-lg text-foam/70 max-w-xl mx-auto">
          Conta em uma frase o problema. A gente responde com um plano em até 48h.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/contato"
            className="group inline-flex items-center gap-2 rounded-md bg-cyan-brand px-7 py-4 text-base font-medium text-ink hover:bg-mist transition-colors"
          >
            Falar com a equipe
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="mailto:binhara@azuris.com.br"
            className="inline-flex items-center gap-2 rounded-md border border-slate/80 bg-deep/40 backdrop-blur-sm px-7 py-4 text-base font-medium hover:border-cyan-brand/60 transition-all"
          >
            binhara@azuris.com.br
          </a>
        </div>
      </div>
    </section>
  );
}
