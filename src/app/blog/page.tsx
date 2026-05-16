import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getAllPosts } from "@/lib/posts";
import { ArrowUpRight, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights de engenharia de dados, IA em produção e o ecossistema Azuris. Posts sobre Hadoop.com.br, DSSBR, ETT, OWorkshop e Curso Pipelines + IA.",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function BlogPage() {
  const posts = await getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">
        {/* Header */}
        <section className="mx-auto max-w-7xl px-6 pt-12 pb-16">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
            Blog
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[0.95]">
            Insights, não{" "}
            <span className="text-brand-gradient">opiniões.</span>
          </h1>
          <p className="mt-6 text-lg text-foam/70 max-w-2xl">
            Posts sobre engenharia de dados, IA em produção, e o ecossistema
            que construímos ao longo de uma década.
          </p>
        </section>

        {/* Featured post */}
        {featured ? (
          <section className="mx-auto max-w-7xl px-6 mb-16">
            <Link
              href={`/blog/${featured.slug}`}
              className="group block rounded-3xl overflow-hidden border border-slate/60 bg-deep hover:border-cyan-brand/50 transition-colors"
            >
              <div className="grid md:grid-cols-2 gap-0">
                {featured.cover ? (
                  <div className="relative aspect-video md:aspect-auto md:min-h-[360px] overflow-hidden">
                    <Image
                      src={featured.cover}
                      alt={featured.title}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-deep/50 via-transparent to-transparent" />
                  </div>
                ) : null}

                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 text-xs text-foam/40 mb-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-brand/10 border border-cyan-brand/30 text-cyan-brand px-2.5 py-1">
                      Em destaque
                    </span>
                    <time dateTime={featured.date}>
                      {dateFormatter.format(new Date(featured.date))}
                    </time>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {featured.readingMinutes} min
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-4xl font-semibold tracking-tight leading-tight group-hover:text-cyan-brand transition-colors">
                    {featured.title}
                  </h2>
                  <p className="mt-4 text-foam/70 text-base md:text-lg leading-relaxed">
                    {featured.excerpt}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-cyan-brand text-sm font-medium">
                    Ler post
                    <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          </section>
        ) : null}

        {/* Grid de posts */}
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group rounded-2xl overflow-hidden border border-slate/60 bg-deep hover:border-cyan-brand/50 transition-colors flex flex-col"
              >
                {p.cover ? (
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={p.cover}
                      alt={p.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep/80 via-transparent to-transparent" />
                  </div>
                ) : null}

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 text-xs text-foam/40 mb-3">
                    <time dateTime={p.date}>
                      {dateFormatter.format(new Date(p.date))}
                    </time>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {p.readingMinutes} min
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold leading-snug mb-3 group-hover:text-cyan-brand transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-sm text-foam/60 leading-relaxed line-clamp-3 flex-1">
                    {p.excerpt}
                  </p>

                  {p.tags?.length ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate/50 text-foam/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
