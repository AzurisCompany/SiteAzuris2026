import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/azuriz"],
      },
    ],
    sitemap: "https://azuris.com.br/sitemap.xml",
    host: "https://azuris.com.br",
  };
}
