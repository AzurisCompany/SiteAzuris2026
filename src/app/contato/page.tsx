import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Mail, Phone, MapPin } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";
import cv from "@/lib/cv.json";

export const metadata: Metadata = {
  title: "Contato — Azuris Engenharia de Dados",
  description:
    "Fale com a Azuris sobre Data Lake, migração de dados, ClickHouse, redução de custo de Big Data ou capacitação corporativa. Resposta em até 48h. WhatsApp, e-mail ou formulário.",
  keywords: [
    "contato Azuris",
    "consultoria dados contato",
    "orçamento Data Lake",
    "consultoria ClickHouse Brasil",
  ],
  openGraph: {
    title: "Contato — Azuris Engenharia de Dados",
    description:
      "Fale com a Azuris sobre Data Lake, migração, ClickHouse, custos de Big Data ou capacitação.",
    type: "website",
  },
  alternates: { canonical: "/contato" },
};

export default function ContatoPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <PageHeader
          eyebrow="Contato"
          size="md"
          title={
            <>
              Conta o problema.
              <br />
              <span className="text-brand-gradient">A gente responde com plano.</span>
            </>
          }
          intro={
            <p>
              Resposta em até 48h úteis. Para palestras, treinamentos,
              parcerias e projetos.
            </p>
          }
        />

        <section className="mx-auto max-w-4xl px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href={`mailto:${cv.email}`}
              className="group rounded-2xl border border-slate/60 bg-deep p-6 hover:border-cyan-brand/60 transition-colors"
            >
              <Mail className="size-6 text-cyan-brand mb-3" />
              <div className="text-xs uppercase tracking-wider text-foam/40 mb-1">
                E-mail
              </div>
              <div className="text-lg font-medium group-hover:text-cyan-brand">
                {cv.email}
              </div>
            </a>
            <a
              href={`tel:${cv.phone.replace(/\D/g, "")}`}
              className="group rounded-2xl border border-slate/60 bg-deep p-6 hover:border-cyan-brand/60 transition-colors"
            >
              <Phone className="size-6 text-cyan-brand mb-3" />
              <div className="text-xs uppercase tracking-wider text-foam/40 mb-1">
                Telefone
              </div>
              <div className="text-lg font-medium font-mono group-hover:text-cyan-brand">
                {cv.phone}
              </div>
            </a>
            <a
              href={cv.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-slate/60 bg-deep p-6 hover:border-cyan-brand/60 transition-colors"
            >
              <LinkedinIcon className="size-6 text-cyan-brand mb-3" />
              <div className="text-xs uppercase tracking-wider text-foam/40 mb-1">
                LinkedIn
              </div>
              <div className="text-lg font-medium group-hover:text-cyan-brand">
                /in/binhara
              </div>
            </a>
            <a
              href={cv.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-slate/60 bg-deep p-6 hover:border-cyan-brand/60 transition-colors"
            >
              <GithubIcon className="size-6 text-cyan-brand mb-3" />
              <div className="text-xs uppercase tracking-wider text-foam/40 mb-1">
                GitHub
              </div>
              <div className="text-lg font-medium group-hover:text-cyan-brand">
                @binharademo
              </div>
            </a>
          </div>

          <div className="mt-14 flex items-center gap-3 text-sm text-foam/50">
            <MapPin className="size-4" />
            {cv.location}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
