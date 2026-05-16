import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, Phone, MapPin } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";
import cv from "@/lib/cv.json";

export const metadata: Metadata = {
  title: "Contato",
  description: "Conta seu problema em uma frase. A gente responde em até 48h.",
};

export default function ContatoPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-32">
        <section className="mx-auto max-w-4xl px-6">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
            Contato
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[0.95]">
            Conta o problema.
            <br />
            <span className="text-brand-gradient">A gente responde com plano.</span>
          </h1>
          <p className="mt-8 text-lg text-foam/70 max-w-2xl">
            Resposta em até 48h úteis. Para palestras, treinamentos, parcerias
            e projetos.
          </p>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4">
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
