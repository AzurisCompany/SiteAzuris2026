// Helper para embutir JSON-LD em qualquer page/layout (Server Component).
// Renderiza um <script type="application/ld+json"> seguro com os dados passados.

type Props = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: Props) {
  const json = Array.isArray(data) ? data : [data];
  return (
    <>
      {json.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(d).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}

const SITE = "https://azuris.com.br";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Azuris",
  alternateName: "Azuris — Engenharia de Dados e IA",
  url: SITE,
  logo: `${SITE}/azuris-logo.svg`,
  description:
    "Consultoria de Engenharia de Dados e IA: lakehouse, pipelines, migração para cloud, ClickHouse, redução de custo de Big Data e capacitação corporativa.",
  email: "binhara@azuris.com.br",
  founder: {
    "@type": "Person",
    name: "Alessandro Binhara",
    jobTitle: "Senior Data Engineer",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Curitiba",
    addressRegion: "PR",
    addressCountry: "BR",
  },
  sameAs: [
    "https://linkedin.com/in/binhara/",
    "https://github.com/binharademo",
  ],
  knowsAbout: [
    "Data Lake",
    "Lakehouse",
    "Apache Iceberg",
    "Delta Lake",
    "Hadoop",
    "Apache Spark",
    "ClickHouse",
    "Snowflake",
    "BigQuery",
    "Migração de dados",
    "Big Data",
    "Engenharia de Dados",
    "Inteligência Artificial",
    "Workshop de IA",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Azuris",
  url: SITE,
  inLanguage: "pt-BR",
  publisher: {
    "@type": "Organization",
    name: "Azuris",
    url: SITE,
  },
};

export const professionalServiceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Azuris — Engenharia de Dados e IA",
  url: SITE,
  description:
    "Construção de Data Lake, migração para Cloud, ClickHouse, redução de custo de Big Data, capacitação corporativa em Big Data e IA.",
  serviceType: [
    "Construção de Data Lake",
    "Migração de Dados para Cloud",
    "Otimização de custo Big Data",
    "Implementação ClickHouse",
    "Treinamento corporativo em Big Data",
    "Workshop de IA para gestores",
  ],
  areaServed: [
    { "@type": "Country", name: "Brasil" },
    { "@type": "Place", name: "América Latina" },
  ],
  provider: {
    "@type": "Organization",
    name: "Azuris",
    url: SITE,
  },
};
