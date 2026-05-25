import * as si from "simple-icons";

type SimpleIcon = { path: string; title: string };

type TechSource =
  | { kind: "si"; slug: keyof typeof si }
  | { kind: "local"; file: string };

export type Tech = {
  name: string;
  url: string;
  source: TechSource;
};

function siToDataUri(slug: keyof typeof si): string {
  const icon = si[slug] as unknown as SimpleIcon;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${icon.path}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function techMaskUrl(t: Tech): string {
  if (t.source.kind === "si") return siToDataUri(t.source.slug);
  return `/tech/${t.source.file}`;
}

// 3 rows of 10, alternating direction in <Stack/>
export const TECH_ROWS: Tech[][] = [
  // Row 1 — Cloud + Compute
  [
    { name: "AWS", url: "https://aws.amazon.com", source: { kind: "local", file: "aws.svg" } },
    { name: "GCP", url: "https://cloud.google.com", source: { kind: "si", slug: "siGooglecloud" } },
    { name: "Azure", url: "https://azure.microsoft.com", source: { kind: "local", file: "azure.svg" } },
    { name: "Oracle", url: "https://www.oracle.com/cloud", source: { kind: "local", file: "oracle.svg" } },
    { name: "Cloudera", url: "https://www.cloudera.com", source: { kind: "si", slug: "siCloudera" } },
    { name: "Gaio Data OS", url: "https://gaiodataos.com", source: { kind: "local", file: "gaio.svg" } },
    { name: "Kubernetes", url: "https://kubernetes.io", source: { kind: "si", slug: "siKubernetes" } },
    { name: "Databricks", url: "https://www.databricks.com", source: { kind: "si", slug: "siDatabricks" } },
    { name: "Snowflake", url: "https://www.snowflake.com", source: { kind: "si", slug: "siSnowflake" } },
    { name: "ClickHouse", url: "https://clickhouse.com", source: { kind: "si", slug: "siClickhouse" } },
  ],
  // Row 2 — Big Data + Storage + Query
  [
    { name: "Spark", url: "https://spark.apache.org", source: { kind: "si", slug: "siApachespark" } },
    { name: "Hive", url: "https://hive.apache.org", source: { kind: "si", slug: "siApachehive" } },
    { name: "Airflow", url: "https://airflow.apache.org", source: { kind: "si", slug: "siApacheairflow" } },
    { name: "NiFi", url: "https://nifi.apache.org", source: { kind: "si", slug: "siApachenifi" } },
    { name: "Kafka", url: "https://kafka.apache.org", source: { kind: "si", slug: "siApachekafka" } },
    { name: "Trino", url: "https://trino.io", source: { kind: "si", slug: "siTrino" } },
    { name: "Presto", url: "https://prestodb.io", source: { kind: "si", slug: "siPresto" } },
    { name: "Delta Lake", url: "https://delta.io", source: { kind: "local", file: "delta.svg" } },
    { name: "Iceberg", url: "https://iceberg.apache.org", source: { kind: "local", file: "iceberg.svg" } },
    { name: "MinIO", url: "https://min.io", source: { kind: "si", slug: "siMinio" } },
  ],
  // Row 3 — DB + Lang + AI + BI
  [
    { name: "Cassandra", url: "https://cassandra.apache.org", source: { kind: "si", slug: "siApachecassandra" } },
    { name: "MongoDB", url: "https://www.mongodb.com", source: { kind: "si", slug: "siMongodb" } },
    { name: "Elasticsearch", url: "https://www.elastic.co", source: { kind: "si", slug: "siElasticsearch" } },
    { name: "Python", url: "https://www.python.org", source: { kind: "si", slug: "siPython" } },
    { name: "Java", url: "https://www.java.com", source: { kind: "local", file: "java.svg" } },
    { name: "Scala", url: "https://www.scala-lang.org", source: { kind: "si", slug: "siScala" } },
    { name: ".NET", url: "https://dotnet.microsoft.com", source: { kind: "si", slug: "siDotnet" } },
    { name: "Power BI", url: "https://www.microsoft.com/power-platform/products/power-bi", source: { kind: "local", file: "powerbi.svg" } },
    { name: "LangChain", url: "https://www.langchain.com", source: { kind: "si", slug: "siLangchain" } },
    { name: "OpenAI", url: "https://openai.com", source: { kind: "local", file: "openai.svg" } },
  ],
];
