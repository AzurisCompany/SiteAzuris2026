import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Cta } from "@/components/sections/Cta";
import { BlogCover } from "@/components/BlogCover";
import { JsonLd } from "@/components/JsonLd";
import { getAllSlugs, getAllPosts, getPostBySlug } from "@/lib/posts";
import { ArrowLeft, Clock } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post não encontrado" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
  };
}

const mdxComponents = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      className="text-cyan-brand hover:text-mist underline-offset-4 hover:underline"
    />
  ),
};

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const all = await getAllPosts();
  const related = all.filter((p) => p.slug !== slug).slice(0, 2);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author ?? "Alessandro Binhara",
      url: "https://linkedin.com/in/binhara/",
    },
    publisher: {
      "@type": "Organization",
      name: "Azuris",
      url: "https://azuris.com.br",
      logo: {
        "@type": "ImageObject",
        url: "https://azuris.com.br/azuris-logo.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://azuris.com.br/blog/${post.slug}`,
    },
    image: post.cover
      ? [`https://azuris.com.br${post.cover}`]
      : undefined,
    keywords: post.tags?.join(", "),
    inLanguage: "pt-BR",
    articleSection: post.tags?.[0],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: "https://azuris.com.br" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://azuris.com.br/blog" },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://azuris.com.br/blog/${post.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[articleSchema, breadcrumbSchema]} />
      <Navbar />
      <main className="flex-1 pt-24">
        {/* Header */}
        <article>
          <header className="relative isolate overflow-hidden border-b border-slate/40">
            {/* Fundo: foto full-bleed atrás (mode=image) OU gradient sutil (mode=logo) */}
            {post.cover && post.coverMode !== "logo" ? (
              <div className="absolute inset-0 -z-10 opacity-25">
                <Image
                  src={post.cover}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/80 to-ink" />
              </div>
            ) : null}
            {post.coverMode === "logo" ? (
              <div
                className="absolute inset-0 -z-10 opacity-30"
                style={{
                  background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${post.coverAccent ?? "#14b7de"}40 0%, transparent 60%)`,
                }}
              />
            ) : null}

            <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm text-foam/50 hover:text-cyan-brand mb-8"
              >
                <ArrowLeft className="size-4" /> Todos os posts
              </Link>

              {/* Brand tile destacado quando é logo */}
              {post.cover && post.coverMode === "logo" ? (
                <BlogCover
                  src={post.cover}
                  alt={post.title}
                  mode="logo"
                  accent={post.coverAccent}
                  priority
                  className="group relative aspect-[16/9] md:aspect-[21/9] rounded-2xl mb-10 border border-slate/60"
                />
              ) : null}

              <div className="flex flex-wrap items-center gap-3 text-xs text-foam/50 mb-5">
                {post.property ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-brand/10 border border-cyan-brand/30 text-cyan-brand px-2.5 py-1 font-mono">
                    {post.property}
                  </span>
                ) : null}
                <time dateTime={post.date}>
                  {dateFormatter.format(new Date(post.date))}
                </time>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {post.readingMinutes} min de leitura
                </span>
                {post.author ? <span>por {post.author}</span> : null}
              </div>

              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
                {post.title}
              </h1>
              <p className="mt-6 text-lg md:text-xl text-foam/80 leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          </header>

          {/* Content */}
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <div
              className="
                prose prose-invert prose-lg max-w-none
                prose-headings:tracking-tight prose-headings:font-semibold
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-foam/85 prose-p:leading-relaxed
                prose-li:text-foam/85
                prose-strong:text-foam prose-strong:font-semibold
                prose-a:text-cyan-brand prose-a:no-underline hover:prose-a:underline
                prose-code:text-mist prose-code:bg-deep prose-code:px-1.5 prose-code:py-0.5
                prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:before:hidden prose-code:after:hidden
                prose-blockquote:border-cyan-brand prose-blockquote:text-foam/70
                prose-table:text-sm prose-th:text-foam prose-th:bg-deep prose-th:px-3 prose-th:py-2
                prose-td:px-3 prose-td:py-2 prose-td:border-slate/40
              "
            >
              <MDXRemote
                source={post.content}
                components={mdxComponents}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [
                      rehypeSlug,
                      [rehypeAutolinkHeadings, { behavior: "wrap" }],
                    ],
                  },
                }}
              />
            </div>

            {/* Tags */}
            {post.tags?.length ? (
              <div className="mt-12 pt-8 border-t border-slate/40 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-mono px-2.5 py-1 rounded border border-slate/50 text-foam/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>

        {/* Related */}
        {related.length ? (
          <section className="border-t border-slate/40 bg-deep/30 py-20">
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
                Continue lendo
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-10">
                Outros posts.
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group rounded-2xl border border-slate/60 bg-deep p-6 hover:border-cyan-brand/50 transition-colors"
                  >
                    <time className="text-xs text-foam/40 font-mono" dateTime={p.date}>
                      {dateFormatter.format(new Date(p.date))}
                    </time>
                    <h3 className="text-xl font-semibold mt-2 mb-2 group-hover:text-cyan-brand transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-sm text-foam/60 line-clamp-2">
                      {p.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <Cta />
      </main>
      <Footer />
    </>
  );
}
