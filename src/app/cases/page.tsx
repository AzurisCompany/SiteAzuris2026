import type { Metadata } from "next";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Cta } from "@/components/sections/Cta";
import { Partners } from "@/components/sections/Partners";
import cv from "@/lib/cv.json";

export const metadata: Metadata = {
  title: "Cases",
  description:
    "Cases reais de migração, lakehouse, performance e IA: RD Station, Buscapé, Sicredi, Logcomex, Unimed.",
};

export default function CasesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">
        <section className="relative isolate overflow-hidden border-b border-slate/40">
          <div className="absolute inset-0 -z-10 opacity-25">
            <Image
              src="/products/hero-bg.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
          </div>
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Cases
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[0.95] max-w-4xl">
              O que entregamos.
              <br />
              <span className="text-brand-gradient">Em números.</span>
            </h1>
            <p className="mt-8 text-lg md:text-xl text-foam/70 max-w-2xl">
              Cinco anos. Centenas de TB. Bilhões de eventos. Zero downtime nas
              migrações críticas.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 gap-4 mb-24 mt-20">
          {cv.cases.map((c) => (
            <article
              key={c.slug}
              className="relative overflow-hidden rounded-2xl border border-slate/60 bg-deep p-7 md:p-8 hover:border-cyan-brand/50 transition-colors"
            >
              <div className="text-xs font-mono uppercase tracking-wider text-foam/40 mb-4">
                {c.client}
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold leading-snug mb-3">
                {c.title}
              </h3>
              <p className="text-base text-foam/70 mb-6">{c.tagline}</p>

              {c.kpis ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {c.kpis.map((k) => (
                    <div
                      key={k.label}
                      className="rounded-lg border border-slate/50 bg-ink/60 px-3 py-3"
                    >
                      <div className="text-2xl font-semibold text-cyan-brand font-mono">
                        {k.value}
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-foam/40 mt-1">
                        {k.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-1.5">
                {c.tech?.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate/50 text-foam/50"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>

        <Partners />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
