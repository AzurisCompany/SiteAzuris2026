import type { Metadata } from "next";
import { ArrowUpRight, Heart } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Cta } from "@/components/sections/Cta";

export const metadata: Metadata = {
  title: "Comunidade — Como a Azuris apoia o software brasileiro",
  description:
    "Conteúdo aberto, encontros gratuitos e grupo de usuários. Hadoop.com.br, GU BigData e o Grupo de Estudos — o esforço não-comercial da Azuris para apoiar a comunidade de dados e software no Brasil.",
  keywords: [
    "comunidade dados Brasil",
    "Hadoop.com.br",
    "GU BigData",
    "grupo de estudos engenharia de dados",
    "comunidade Big Data",
  ],
  openGraph: {
    title: "Comunidade — Como a Azuris apoia o software brasileiro",
    description:
      "Conteúdo aberto, encontros gratuitos e grupo de usuários. O esforço não-comercial da Azuris pela comunidade de dados.",
    type: "website",
  },
  alternates: { canonical: "/comunidade" },
};

type Initiative = {
  name: string;
  emoji: string;
  meta: string;
  href: string;
  cta: string;
  summary: string;
  details: string[];
};

const INITIATIVES: Initiative[] = [
  {
    name: "Hadoop.com.br",
    emoji: "🐘",
    meta: "Portal de conteúdo · PT-BR",
    href: "https://hadoop.com.br",
    cta: "Acessar o portal",
    summary:
      "Uma das referências mais antigas de Hadoop e Big Data em português. Tutoriais, conceitos e artigos — criado e mantido pela Azuris, aberto pra qualquer um.",
    details: [
      "Conteúdo técnico em PT-BR, sem paywall.",
      "Conceitos, ecossistema Hadoop e arquitetura de dados.",
      "Mantido pela Azuris desde os primeiros anos do Big Data no Brasil.",
    ],
  },
  {
    name: "GU BigData",
    emoji: "👥",
    meta: "Grupo de usuários · Comunidade",
    href: "https://gubigdata.com.br",
    cta: "Conhecer o grupo",
    summary:
      "Grupo de Usuários de Big Data: engenheiros, cientistas e curiosos de dados trocando experiência. A Azuris ajuda a organizar e a manter de pé.",
    details: [
      "Encontros, palestras e troca entre profissionais de dados.",
      "Espaço aberto pra quem está começando e pra quem já vive disso.",
      "Organização apoiada pela Azuris — sem agenda comercial.",
    ],
  },
  {
    name: "Grupo de Estudos",
    emoji: "📚",
    meta: "Toda semana · Gratuito",
    href: "https://gubigdata.com.br/grupo-de-estudos/",
    cta: "Participar dos encontros",
    summary:
      "Engenharia de dados na prática, ao vivo, toda semana. Gratuito e aberto — sem venda no meio, só gente aprendendo junto.",
    details: [
      "Encontros semanais ao vivo, abertos a todos.",
      "Mão na massa: pipelines, lakehouse e ferramentas reais.",
      "Comunidade que aprende em conjunto, sem custo.",
    ],
  },
];

export default function ComunidadePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center gap-2 text-emerald-accent">
              <Heart className="size-3.5" /> Comunidade
            </span>
          }
          size="md"
          title={
            <>
              Onde a comunidade
              <br />
              <span className="text-brand-gradient">de dados se encontra.</span>
            </>
          }
          intro={
            <p>
              Conteúdo aberto, encontros gratuitos toda semana e um grupo de
              usuários que segue forte. A Azuris ajuda a organizar e a manter os
              espaços onde a comunidade de dados brasileira aprende, troca e
              cresce junto.
            </p>
          }
        />

        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {INITIATIVES.map((i) => (
              <article
                key={i.name}
                className="group relative flex flex-col rounded-2xl border border-slate/60 bg-deep p-7 hover:border-emerald-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{i.emoji}</span>
                  <h2 className="text-2xl font-semibold">{i.name}</h2>
                </div>
                <div className="text-xs uppercase tracking-wider text-emerald-accent/80 mb-4">
                  {i.meta}
                </div>
                <p className="text-foam/75 leading-relaxed">{i.summary}</p>

                <ul className="mt-5 space-y-2.5 text-sm text-foam/65">
                  {i.details.map((d) => (
                    <li key={d} className="flex gap-2.5">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-accent/70" />
                      <span className="leading-relaxed">{d}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={i.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-1.5 self-start rounded-lg border border-emerald-accent/40 bg-emerald-accent/10 px-4 py-2.5 text-sm font-semibold text-emerald-accent hover:bg-emerald-accent/20 transition-colors"
                >
                  {i.cta}
                  <ArrowUpRight className="size-4" />
                </a>
              </article>
            ))}
          </div>

          {/* Por quê */}
          <div className="mt-16 rounded-2xl border border-slate/60 bg-gradient-to-br from-deep to-ink p-8 md:p-10">
            <div className="max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Comunidade que se constrói junta.
              </h2>
              <p className="mt-4 text-foam/70 text-lg leading-relaxed">
                A comunidade de dados no Brasil foi construída por quem
                compartilhou conhecimento de graça — tutorial, palestra, encontro
                aberto. A Azuris cresceu nesse caldo e faz questão de manter o
                espírito vivo: conteúdo aberto, encontro toda semana e um grupo
                de usuários forte, pra quem está começando e pra quem já vive de
                dados.
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
