import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Cta } from "@/components/sections/Cta";
import {
  getAllProdutoSlugs,
  getProdutoCatalogo,
} from "@/lib/produtos-catalogo";

export async function generateStaticParams() {
  return getAllProdutoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/produtos/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const p = getProdutoCatalogo(slug);
  if (!p) return { title: "Produto não encontrado" };
  const title = `${p.nome} — ${p.tagline}`;
  return {
    title,
    description: p.resumo,
    openGraph: { title, description: p.resumo, type: "website" },
    alternates: { canonical: `/produtos/${p.slug}` },
  };
}

export default async function ProdutoPage(
  props: PageProps<"/produtos/[slug]">,
) {
  const { slug } = await props.params;
  const p = getProdutoCatalogo(slug);
  if (!p) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <span className="text-base">{p.emoji}</span> {p.categoria}
              {p.badge ? (
                <span className="rounded-full border border-amber-accent/30 bg-amber-accent/10 px-2 py-0.5 text-amber-accent">
                  {p.badge}
                </span>
              ) : null}
            </span>
          }
          size="sm"
          title={p.nome}
          intro={<p>{p.tagline}</p>}
        />

        <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-1.5 text-sm text-foam/50 hover:text-foam transition-colors"
          >
            <ArrowLeft className="size-4" /> Todos os produtos
          </Link>

          {/* Resumo */}
          <p className="mt-8 text-xl md:text-2xl text-foam/85 leading-relaxed max-w-3xl">
            {p.resumo}
          </p>

          {/* CTA principal pro site */}
          <div className="mt-8">
            <a
              href={p.site}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-brand px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-mist"
            >
              {p.ctaLabel}
              <ArrowUpRight className="size-4" />
            </a>
            <p className="mt-2 text-xs text-foam/40">
              Você vai para {p.siteHost}
            </p>
          </div>

          {/* Destaques */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {p.destaques.map((d) => (
              <div
                key={d.titulo}
                className="rounded-2xl border border-slate/60 bg-deep p-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Check className="size-4 text-cyan-brand" />
                  <h2 className="font-semibold">{d.titulo}</h2>
                </div>
                <p className="text-sm text-foam/70 leading-relaxed">{d.texto}</p>
              </div>
            ))}
          </div>

          {/* Para quem */}
          <div className="mt-6 rounded-2xl border border-slate/60 bg-gradient-to-br from-deep to-ink p-6 md:p-7">
            <div className="flex items-start gap-3">
              <Users className="size-5 text-cyan-brand shrink-0 mt-0.5" />
              <div>
                <div className="text-xs uppercase tracking-wider text-foam/40 mb-1">
                  Para quem é
                </div>
                <p className="text-foam/80 leading-relaxed">{p.publico}</p>
              </div>
            </div>
          </div>

          {/* CTA final pro site */}
          <div className="mt-12 flex flex-wrap items-center gap-3">
            <a
              href={p.site}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-brand px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-mist"
            >
              {p.ctaLabel}
              <ArrowUpRight className="size-4" />
            </a>
            <a
              href={p.site}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate/60 px-6 py-3 text-sm font-semibold text-foam/80 hover:border-cyan-brand/60 hover:text-foam transition-colors"
            >
              {p.siteHost}
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        </section>

        <Cta />
      </main>
      <Footer />
    </>
  );
}
