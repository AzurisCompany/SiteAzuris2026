import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { ArrowRight, Sparkles, ExternalLink, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Lakehouse: Pipeline na Prática — Curso online · Azuris",
  description:
    "Curso online 100% prática, em andamento e autoguiado. Construa um pipeline Lakehouse completo, módulo a módulo: MinIO + Iceberg + Spark + Airflow + Superset. Aulas gravadas + encontros ao vivo + mentorias 1:1. Entre quando quiser.",
  keywords: [
    "curso lakehouse",
    "curso engenharia de dados",
    "curso apache iceberg",
    "curso apache spark",
    "curso airflow",
    "curso superset",
    "curso MinIO",
    "pipeline de dados",
    "medallion architecture",
    "DSSBR",
    "GUBigData",
  ],
  openGraph: {
    title: "Lakehouse: Pipeline na Prática — Curso online autoguiado",
    description:
      "MinIO + Iceberg + Spark + Airflow + Superset. Curso em andamento — entre quando quiser. Aulas gravadas + encontros ao vivo + mentorias 1:1 · bônus DSSBR exclusivo.",
    type: "website",
  },
  // Página-teaser: o conteúdo completo (e canônico) vive na landing.
  alternates: { canonical: "/lakehouse-comunidade/" },
};

const STACK_PATH = "/lakehouse-comunidade/assets/stack/_oficial";

const HERO_TOOLS = [
  { name: "MinIO", src: `${STACK_PATH}/minio.svg`, w: 64, h: 32 },
  { name: "Apache Iceberg", src: `${STACK_PATH}/iceberg.png`, w: 64, h: 32 },
  { name: "Apache Spark", src: `${STACK_PATH}/spark.png`, w: 64, h: 32 },
  { name: "Apache Airflow", src: `${STACK_PATH}/airflow.png`, w: 64, h: 32 },
  { name: "Apache Superset", src: `${STACK_PATH}/superset.svg`, w: 64, h: 32 },
];

export default function CursoPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <PageHeader
          size="lg"
          particleCount={2200}
          eyebrow={
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-accent bg-amber-accent/10 border border-amber-accent/30 rounded-full px-2.5 py-1">
              <Sparkles className="size-3" /> Comunidade DSSBR · Em andamento · Entre quando quiser
            </span>
          }
          title={
            <>
              Lakehouse:
              <br />
              <span className="text-brand-gradient">Pipeline na Prática</span>
            </>
          }
          intro={
            <>
              <p>
                Construa um pipeline Lakehouse completo — do zero ao dashboard,
                módulo a módulo. Curso online{" "}
                <strong className="text-foam">100% prática</strong>, em
                andamento e autoguiado (sala invertida): aulas gravadas que você
                segue no seu ritmo, mais encontros temáticos ao vivo e mentorias
                1:1 pra tirar dúvidas. Entre quando quiser e comece pelo Módulo
                1, com a stack que o mercado contrata em 2026.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {HERO_TOOLS.map((t) => (
                  <span
                    key={t.name}
                    title={t.name}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-foam px-3"
                  >
                    <Image
                      src={t.src}
                      alt={t.name}
                      width={t.w}
                      height={t.h}
                      className="h-5 w-auto object-contain"
                      unoptimized
                    />
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/lakehouse-comunidade/"
                  className="group inline-flex items-center gap-2 rounded-md bg-cyan-brand px-6 py-3.5 text-base font-medium text-ink hover:bg-mist transition-colors"
                >
                  Ver landing completa
                  <ExternalLink className="size-4" />
                </a>
                <a
                  href="/lakehouse-comunidade/ementa.html"
                  className="inline-flex items-center gap-2 rounded-md border border-slate/80 bg-deep/40 backdrop-blur-sm px-6 py-3.5 text-base font-medium hover:border-cyan-brand/60 transition-all"
                >
                  <FileText className="size-4" />
                  Ementa detalhada
                </a>
                <Link
                  href="/lakehouse-comunidade/inscricao?utm_source=produtos&utm_medium=hero&utm_campaign=lakehouse-t1-l1"
                  className="inline-flex items-center gap-2 rounded-md border border-slate/80 bg-deep/40 backdrop-blur-sm px-6 py-3.5 text-base font-medium hover:border-cyan-brand/60 transition-all"
                >
                  Quero garantir vaga
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
