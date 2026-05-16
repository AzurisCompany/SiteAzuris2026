import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
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
      <main className="flex-1 pt-20">
        <PageHeader
          eyebrow="Sobre"
          size="md"
          title={
            <>
              Engenharia de dados.
              <br />
              <span className="text-brand-gradient">Cultura de engenharia.</span>
            </>
          }
          intro={
            <p>
              A Azuris é uma casa de engenharia. Nasceu em mobile, virou nuvem,
              hoje é dados e IA. Cada migração, cada pipeline, cada modelo tem
              um SLA, um número e um responsável.
            </p>
          }
        />

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
