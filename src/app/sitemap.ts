import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getAllCaseSlugs } from "@/lib/cases";

const SITE = "https://azuris.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Rotas estáticas — prioridade calibrada por valor SEO
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE}/servicos`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${SITE}/servicos/construcao-data-lake`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/servicos/migracao-de-dados`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/servicos/reducao-custo-big-data`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/servicos/clickhouse`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/servicos/treinamento-corporativo`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/cases`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/produtos`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${SITE}/produtos/curso-pipelines`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/lakehouse-comunidade/`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE}/lakehouse-comunidade/ementa.html`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/sobre`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/contato`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  // Posts do blog
  const posts = await getAllPosts();
  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  // Cases com detalhe
  const caseSlugs = getAllCaseSlugs();
  const caseRoutes: MetadataRoute.Sitemap = caseSlugs.map((slug) => ({
    url: `${SITE}/cases/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...blogRoutes, ...caseRoutes];
}
