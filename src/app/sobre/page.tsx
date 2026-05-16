import type { Metadata } from "next";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Founder } from "@/components/sections/Founder";
import { Stack } from "@/components/sections/Stack";
import { Cta } from "@/components/sections/Cta";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "20+ anos transformando dados em vantagem competitiva. Conheça a Azuris e a história do Binhara.",
};

const PILLARS = [
  {
    title: "Engenharia primeiro",
    text: "Toda entrega tem SLA, número e responsável. Nada de slide bonito sobre arquitetura imaginária.",
  },
  {
    title: "Dados em produção",
    text: "Pipeline rodando ou não rodando — sem 'PoC eterna'. A definição de pronto é produção observada.",
  },
  {
    title: "Cultura de mentor",
    text: "Quando treinamos, o time fica autônomo. Sem dependência de consultoria perpétua.",
  },
];

export default function SobrePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">
        {/* Hero da página */}
        <section className="relative isolate overflow-hidden border-b border-slate/40">
          <div className="absolute inset-0 -z-10 opacity-30">
            <Image
              src="/products/cloud.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/80 to-ink" />
          </div>
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Sobre
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[0.95] max-w-4xl">
              Engenharia de dados.
              <br />
              <span className="text-brand-gradient">
                Cultura de engenharia.
              </span>
            </h1>
            <p className="mt-8 text-lg md:text-xl text-foam/80 leading-relaxed max-w-3xl">
              A Azuris é uma casa de engenharia. Nasceu em mobile, virou nuvem,
              hoje é dados e IA. Cada migração, cada pipeline, cada modelo tem
              um SLA, um número e um responsável.
            </p>
          </div>
        </section>

        {/* 3 pilares */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PILLARS.map((p, i) => (
              <div
                key={p.title}
                className="relative rounded-2xl border border-slate/60 bg-deep p-7"
              >
                <div className="text-cyan-brand font-mono text-sm mb-2">
                  0{i + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3">{p.title}</h3>
                <p className="text-foam/70 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <Founder />
        <Stack />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
