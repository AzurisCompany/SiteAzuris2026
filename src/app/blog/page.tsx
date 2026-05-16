import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BlogCover } from "@/components/BlogCover";
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

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">
        {/* Header */}
        <section className="mx-auto max-w-5xl px-6 pt-12 pb-16">
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

        {/* Lista cronológica */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <ol className="space-y-4">
            {posts.map((p, idx) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="
                    group relative grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6
                    rounded-2xl border border-slate/60 bg-deep/60
                    hover:border-cyan-brand/50 hover:bg-deep
                    transition-all duration-300 overflow-hidden
                  "
                >
                  {/* Cover/thumbnail */}
                  <BlogCover
                    src={p.cover ?? "/azuris-logo.svg"}
                    alt={p.title}
                    mode={p.coverMode}
                    accent={p.coverAccent}
                    priority={idx === 0}
                    className="aspect-[16/9] md:aspect-auto md:h-full md:min-h-[200px]"
                  />

                  {/* Texto */}
                  <div className="p-6 md:p-7 md:pl-2 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foam/45 mb-3">
                      {p.property ? (
                        <span className="inline-flex items-center rounded-full bg-cyan-brand/10 border border-cyan-brand/30 text-cyan-brand px-2.5 py-0.5 font-mono">
                          {p.property}
                        </span>
                      ) : null}
                      <time dateTime={p.date}>
                        {dateFormatter.format(new Date(p.date))}
                      </time>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {p.readingMinutes} min
                      </span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-semibold leading-snug tracking-tight group-hover:text-cyan-brand transition-colors">
                      {p.title}
                    </h2>

                    <p className="mt-3 text-sm md:text-base text-foam/65 leading-relaxed line-clamp-2 md:line-clamp-3">
                      {p.excerpt}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      {p.tags?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {p.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate/50 text-foam/45"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : <span />}
                      <ArrowUpRight className="size-4 text-foam/30 group-hover:text-cyan-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer />
    </>
  );
}
