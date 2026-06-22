import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Cta } from "@/components/sections/Cta";
import {
  ArrowRight,
  Sparkles,
  X as XIcon,
  Triangle,
  ExternalLink,
  FileText,
  Calendar,
  Shield,
  Check,
  Star,
  Play,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Lakehouse: Pipeline na Prática — Curso 5 semanas · Azuris",
  description:
    "Curso online ao vivo, 100% hands-on. 5 semanas construindo um pipeline Lakehouse completo: MinIO + Iceberg + Spark + Airflow + Superset. Turma 1 Comunidade DSSBR começa 22/jun/2026.",
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
    title: "Lakehouse: Pipeline na Prática — 5 semanas hands-on",
    description:
      "MinIO + Iceberg + Spark + Airflow + Superset. Turma 1 Comunidade começa 22/jun/2026 — bônus DSSBR exclusivo.",
    type: "website",
  },
  alternates: { canonical: "/produtos/curso-pipelines" },
};

const STACK_PATH = "/lakehouse-comunidade/assets/stack/_oficial";

const HERO_TOOLS = [
  { name: "MinIO", src: `${STACK_PATH}/minio.svg`, w: 64, h: 32 },
  { name: "Apache Iceberg", src: `${STACK_PATH}/iceberg.png`, w: 64, h: 32 },
  { name: "Apache Spark", src: `${STACK_PATH}/spark.png`, w: 64, h: 32 },
  { name: "Apache Airflow", src: `${STACK_PATH}/airflow.png`, w: 64, h: 32 },
  { name: "Apache Superset", src: `${STACK_PATH}/superset.svg`, w: 64, h: 32 },
];

const DIAGNOSTICO = [
  {
    setup: "Leu sobre Lakehouse, viu webinars, assistiu cursos.",
    punch: "Nunca subiu um pipeline real do começo ao fim.",
  },
  {
    setup: "Tem certificação de Spark no LinkedIn.",
    punch: "Nunca rodou um spark-submit num caso de verdade.",
  },
  {
    setup: "Time pede experiência prática em Airflow.",
    punch: "Você só tem a teoria.",
  },
  {
    setup: "Quer migrar pra Engenharia de Dados.",
    punch: "Stack moderno não tá no seu portfólio.",
  },
  {
    setup: "Sabe Medallion no slide.",
    punch: "Não sabe configurar um catálogo Iceberg.",
  },
];

const CENARIO_STATS = [
  { value: "9", label: "Tabelas relacionadas" },
  { value: "~100MB", label: "Dados sintéticos" },
  { value: "pt-BR", label: "CPF · CEP · UF · categorias reais" },
  { value: "5", label: "Semanas, mesmo cenário" },
];

const TABELAS = [
  "pedidos",
  "clientes",
  "itens",
  "produtos",
  "pagamentos",
  "avaliações",
  "sellers",
  "geolocalização",
  "categorias",
];

const STACK = [
  {
    papel: "Object Storage",
    titulo: "MinIO",
    desc: "Data Lake S3-compatível rodando local. Onde os dados vivem.",
    src: `${STACK_PATH}/minio.svg`,
    accent: "#FF4438",
  },
  {
    papel: "Table Format",
    titulo: "Apache Iceberg",
    desc: "Tabelas com ACID, time travel e schema evolution sobre o Lake.",
    src: `${STACK_PATH}/iceberg.png`,
    accent: "#3D7FBF",
  },
  {
    papel: "Processing",
    titulo: "Apache Spark",
    desc: "Motor distribuído pra limpar, juntar e modelar dados em PySpark.",
    src: `${STACK_PATH}/spark.png`,
    accent: "#E25A1C",
  },
  {
    papel: "Orchestration",
    titulo: "Apache Airflow",
    desc: "DAG diária com retry, sensors e observabilidade do pipeline.",
    src: `${STACK_PATH}/airflow.png`,
    accent: "#017CEE",
  },
  {
    papel: "BI · Dashboards",
    titulo: "Apache Superset",
    desc: "Dashboards interativos conectados via Spark Thrift às tabelas Gold.",
    src: `${STACK_PATH}/superset.svg`,
    accent: "#20A8D8",
  },
];

const ROADMAP = [
  {
    n: 1,
    meta: "Semana 1 · 4h ao vivo",
    title: "Sobe a stack",
    desc: "Docker compose, Medallion Architecture na prática. Sobe as 5 ferramentas e valida acesso aos UIs.",
    entrega: "Stack rodando + screenshots dos UIs",
    tools: ["minio", "iceberg", "spark", "airflow", "superset"],
  },
  {
    n: 2,
    meta: "Semana 2 · 4h ao vivo",
    title: "Carrega os dados",
    desc: "9 CSVs viram tabelas Iceberg versionadas no MinIO. Demo de ACID e time travel ao vivo.",
    entrega: "9 tabelas Bronze consultáveis",
    tools: ["minio", "iceberg"],
  },
  {
    n: 3,
    meta: "Semana 3 · 4h ao vivo",
    title: "Modela com Spark",
    desc: "Limpeza, joins e modelagem dimensional em PySpark. Sai com fato_vendas + 4 dimensões em estrela.",
    entrega: "Modelo Silver + Gold pronto",
    tools: ["spark"],
  },
  {
    n: 4,
    meta: "Semana 4 · 4h ao vivo",
    title: "Automatiza no Airflow",
    desc: "DAG diária com retry, sensors e observabilidade. Orquestra o pipeline inteiro — agora roda sozinho.",
    entrega: "Pipeline agendado e observável",
    tools: ["airflow"],
  },
  {
    n: 5,
    meta: "Semana 5 · 4h ao vivo",
    title: "Publica o dashboard",
    desc: "Superset conecta nas tabelas Iceberg via Spark Thrift. Dashboard de negócio publicado e apresentação ao vivo.",
    entrega: "Dashboard + repo GitHub público",
    tools: ["superset"],
  },
];

const TOOL_LOGOS: Record<string, string> = {
  minio: `${STACK_PATH}/minio.svg`,
  iceberg: `${STACK_PATH}/iceberg.png`,
  spark: `${STACK_PATH}/spark.png`,
  airflow: `${STACK_PATH}/airflow.png`,
  superset: `${STACK_PATH}/superset.svg`,
};

const DIFERENCIAIS = [
  {
    n: "01",
    title: "Você não assiste — você coda.",
    text: "O professor compartilha tela e digita ao vivo. Você digita junto. Quem trava, todo mundo espera. Seu cérebro percorre o caminho inteiro, não só o olho.",
  },
  {
    n: "02",
    title: "Cenário brasileiro real.",
    text: "9 tabelas, ~100MB, sujeira proposital pra limpar. Você resolve problemas reais de modelagem, qualidade e performance — não brinca com SELECT 1.",
  },
  {
    n: "03",
    title: "Stack que o mercado contrata em 2026.",
    text: "Nada de Hadoop morto, nada de tutorial de 2018. Mesma stack que aparece em job descriptions de Engenheiro de Dados Sênior hoje.",
  },
  {
    n: "04",
    title: "Você sai com portfólio público.",
    text: "Pipeline + dashboard no GitHub. Recrutador testa em 5 minutos e vê que é seu de verdade. Sem firula, é evidência.",
  },
];

const PARA_QUEM_SIM = [
  "É analista de dados querendo subir pra Engenharia de Dados",
  "É dev backend curioso sobre o stack analítico moderno",
  "É engenheiro junior e precisa de stack contemporâneo no portfólio",
  "É DBA migrando de SQL Server/Oracle pro mundo Big Data",
];

const PARA_QUEM_NAO = [
  "Nunca programou em Python (exigimos intermediário)",
  "Nunca usou Docker (precisa estar instalado e funcionando)",
  "Quer curso 100% gravado pra ver no celular no trânsito",
  "Busca certificação acadêmica ou validação MEC",
];

const PREREQS = [
  { strong: "Python intermediário", rest: "— loops, funções, instalar pacote via pip" },
  { strong: "SQL básico-intermediário", rest: "— SELECT, JOIN, GROUP BY, subqueries" },
  { strong: "Linha de comando Linux", rest: "— navegar, editar arquivo, rodar comando" },
  { strong: "Docker Desktop", rest: "instalado e rodando" },
  { strong: "Máquina com 16GB de RAM", rest: "e 50GB livres em disco" },
  { strong: "~5h por semana", rest: "de dedicação durante as 5 semanas" },
];

const BONUS = [
  { title: "Acesso vitalício", text: "Às aulas gravadas. Revise quantas vezes quiser." },
  { title: "Discord da turma", text: "Comunidade exclusiva — você, colegas e professor." },
  { title: "Cheat sheets", text: "PySpark, SQL Iceberg e operators do Airflow." },
  { title: "Docker templates", text: "Pra acelerar setups futuros no seu trabalho." },
  { title: "Certificado", text: "De conclusão, após o projeto final aprovado." },
];

const LOTES = [
  {
    badge: "Founder",
    preco: "197",
    vagas: "5 vagas · convite pessoal",
    features: [
      "Curso completo (20h)",
      "Ingresso DSSBR 2026 (R$ 520)",
      "Discord vitalício + cheat sheets",
      "Certificado de conclusão",
    ],
    status: "Apenas por convite",
    destaque: false,
    cta: null,
  },
  {
    badge: "Lote 1 · Aberto",
    preco: "550",
    vagas: "15 vagas · esgotando",
    features: [
      "Curso completo (20h)",
      "Ingresso DSSBR 2026 (R$ 520)",
      "Discord vitalício + cheat sheets",
      "Certificado de conclusão",
      "Acesso à comunidade DSSBR/GUBigData",
    ],
    status: "Cartão em até 5x (1x à vista, 2-5x com juros) · Pix à vista com 5% off",
    destaque: true,
    cta: {
      label: "Garantir vaga no Lote 1",
      href: "/lakehouse-comunidade/inscricao?utm_source=produtos&utm_medium=cta&utm_campaign=lakehouse-t1-l1",
    },
  },
  {
    badge: "Lote 2",
    preco: "750",
    vagas: "20 vagas · abre após Lote 1 esgotar",
    features: [
      "Curso completo (20h)",
      "Ingresso DSSBR 2026 (R$ 520)",
      "Discord vitalício + cheat sheets",
      "Certificado de conclusão",
    ],
    status: "Cartão em até 5x (1x à vista, 2-5x com juros) · Pix à vista com 5% off",
    destaque: false,
    cta: null,
  },
  {
    badge: "Mercado · Turma 2",
    preco: "1.197",
    vagas: "Próxima turma · set/2026",
    features: [
      "Curso completo (20h)",
      "Sem ingresso DSSBR",
      "Discord vitalício",
      "Certificado de conclusão",
    ],
    status: "Indisponível agora · sem preço de comunidade",
    destaque: false,
    cta: null,
    disabled: true,
  },
];

const FAQ = [
  {
    q: "Preciso saber Spark ou Airflow antes?",
    a: "Não. O curso ensina os dois do zero. Assumimos só Python intermediário e SQL básico.",
  },
  {
    q: "Funciona em Mac, Linux e Windows?",
    a: "Sim. Toda a stack roda em Docker — testado nos três sistemas operacionais.",
  },
  {
    q: "E se eu perder uma aula ao vivo?",
    a: "As aulas ficam gravadas. Mas você perde o hands-on em grupo, que é o melhor do curso — recomendamos não perder.",
  },
  {
    q: "É curso oficial Apache, MEC ou tem pós-graduação?",
    a: "Não. É curso livre comercial, foco 100% em prática profissional. Você sai com portfólio público, não com certificado de pós.",
  },
  {
    q: "O curso garante uma vaga depois?",
    a: "Não. Garantimos que você sai com um pipeline funcional no GitHub — recrutadores podem validar sozinhos. O resto é com você (mas a evidência prática vale ouro em entrevista).",
  },
  {
    q: "Quantos alunos por turma?",
    a: "Máximo 40 na Turma 1 (Comunidade). A partir da Turma 2 (Mercado), reduzimos pra 30 alunos por turma — limite real pra manter hands-on individualizado.",
  },
  {
    q: "Por que a Turma 1 tem preço de comunidade?",
    a: "Os primeiros 40 alunos vêm da base do DSSBR e do GUBigData — pessoas que já participam dos eventos e do grupo de usuários. Estamos retribuindo a comunidade que sustenta nosso trabalho. A partir da Turma 2, o preço sobe pro valor de mercado.",
  },
  {
    q: "O bônus DSSBR vale pra todas as turmas?",
    a: "Não. Só Turma 1. A partir de setembro/2026 (Turma 2), as inscrições não incluem o ingresso DSSBR — é benefício exclusivo de quem entrar agora, na turma de lançamento.",
  },
  {
    q: "Como funciona a entrega?",
    a: "Aulas ao vivo via Zoom, comunidade no Discord, gravações no portal do aluno. Após a compra você recebe acesso por e-mail em até 24h.",
  },
  {
    q: "Posso parcelar?",
    a: "Sim, em até 5x no cartão. 1x é à vista sem juros; de 2x a 5x os juros do cartão ficam por sua conta. No Pix você paga à vista com 5% de desconto.",
  },
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
              <Sparkles className="size-3" /> Turma 1 · Comunidade · 22/jun/2026
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
                Em 5 semanas, você constrói um pipeline Lakehouse completo —
                do zero ao dashboard. Curso online ao vivo,{" "}
                <strong className="text-foam">100% hands-on</strong>. Você não
                assiste — coda junto com o professor, com a stack que o
                mercado contrata em 2026.
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

        {/* DIAGNÓSTICO */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Diagnóstico
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-10">
              Quantos se aplicam{" "}
              <span className="text-brand-gradient">a você?</span>
            </h2>
            <div className="rounded-2xl border border-slate/60 bg-deep divide-y divide-slate/40">
              {DIAGNOSTICO.map((d, i) => (
                <div key={i} className="flex gap-4 p-6 md:p-7">
                  <div className="flex-none mt-1">
                    <span className="inline-flex size-7 items-center justify-center rounded-md border border-slate/60 bg-ink text-foam/40">
                      <XIcon className="size-4" />
                    </span>
                  </div>
                  <div className="text-foam/80 leading-relaxed">
                    <span className="text-foam/50">{d.setup} </span>
                    <strong className="text-foam">{d.punch}</strong>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-lg text-foam/80">
              <strong className="text-foam">Marcou 2 ou mais?</strong> Esse
              curso foi feito{" "}
              <span className="text-cyan-brand">pra você</span>. Vamos
              resolver isso em 5 semanas.
            </p>
          </div>
        </section>

        {/* CENÁRIO OLAKEHOUSE */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              O cenário do curso
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-10">
              <span className="text-brand-gradient">Olakehouse</span> —
              marketplace brasileiro fictício pra mexer de verdade
            </h2>
            <div className="rounded-2xl border border-slate/60 bg-deep p-8 md:p-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 pb-10 border-b border-slate/40">
                {CENARIO_STATS.map((s) => (
                  <div key={s.label}>
                    <div className="text-3xl md:text-4xl font-semibold text-cyan-brand mb-1">
                      {s.value}
                    </div>
                    <div className="text-sm text-foam/60">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="text-sm uppercase tracking-[0.18em] text-foam/60 mb-4">
                As 9 tabelas que você vai mexer
              </div>
              <div className="flex flex-wrap gap-2">
                {TABELAS.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-md border border-cyan-brand/30 bg-cyan-brand/5 px-3 py-1.5 text-sm font-mono text-cyan-brand"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-4 rounded-xl border border-amber-accent/30 bg-amber-accent/5 p-6">
              <Triangle className="size-5 text-amber-accent flex-none mt-1" />
              <div className="text-foam/80 leading-relaxed">
                <strong className="text-foam">
                  Sujeira pedagógica controlada.
                </strong>{" "}
                O dataset vem com nulos, duplicados, encoding misto e
                timestamps em fuso errado — tudo intencional. Você vai limpar
                isso na camada Silver com <code className="text-cyan-brand">PySpark</code>.
                Igual à vida real, sem o &ldquo;Hello World&rdquo;
                idealizado.
              </div>
            </div>
          </div>
        </section>

        {/* STACK */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              A stack do curso
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-12 max-w-3xl">
              5 ferramentas open source — todas em{" "}
              <span className="text-brand-gradient">vagas reais</span> de
              Eng. de Dados em 2026
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {STACK.map((s) => (
                <div
                  key={s.titulo}
                  className="group rounded-2xl border border-slate/60 bg-deep p-6 hover:border-cyan-brand/60 transition-colors"
                  style={{
                    borderTopColor: s.accent,
                    borderTopWidth: 2,
                  }}
                >
                  <div className="text-[11px] uppercase tracking-[0.15em] text-foam/50 mb-4">
                    {s.papel}
                  </div>
                  <div className="h-14 flex items-center mb-4 bg-foam rounded-md px-3">
                    <Image
                      src={s.src}
                      alt={s.titulo}
                      width={120}
                      height={48}
                      className="h-8 w-auto object-contain"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{s.titulo}</h3>
                  <p className="text-sm text-foam/70 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-foam/70">
              Todas rodam em Docker, na sua máquina.{" "}
              <strong className="text-foam">
                Você sai do curso dominando as cinco.
              </strong>
            </p>
          </div>
        </section>

        {/* ROADMAP 5 SEMANAS */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Como o curso se desenrola
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-12">
              Da matrícula ao dashboard,{" "}
              <span className="text-brand-gradient">5 semanas estruturadas</span>
            </h2>

            <div className="rounded-2xl border border-cyan-brand/40 bg-cyan-brand/5 p-5 mb-6 flex gap-4">
              <Play className="size-5 text-cyan-brand flex-none mt-1" />
              <div className="text-foam/80">
                <strong className="text-foam">Você começa com</strong> 9 CSVs
                do Olakehouse · ~100MB · dados brasileiros sintéticos
              </div>
            </div>

            <div className="space-y-4">
              {ROADMAP.map((r) => (
                <div
                  key={r.n}
                  className="rounded-2xl border border-slate/60 bg-deep p-6 md:p-7"
                >
                  <div className="flex flex-wrap items-start gap-6">
                    <div className="text-5xl font-mono font-semibold text-cyan-brand/40 leading-none">
                      {r.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.15em] text-cyan-brand mb-1">
                            {r.meta}
                          </div>
                          <h3 className="text-xl font-semibold">{r.title}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {r.tools.map((t) => (
                            <span
                              key={t}
                              className="inline-flex h-8 items-center justify-center rounded bg-foam px-2"
                            >
                              <Image
                                src={TOOL_LOGOS[t]}
                                alt={t}
                                width={56}
                                height={20}
                                className="h-4 w-auto object-contain"
                                unoptimized
                              />
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-foam/70 leading-relaxed mb-3">
                        {r.desc}
                      </p>
                      <div className="inline-flex items-center gap-2 rounded-md border border-slate/60 bg-ink/60 px-3 py-1.5 text-sm text-foam/80">
                        <Check className="size-3.5 text-cyan-brand" />
                        Entrega: {r.entrega}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-accent/40 bg-amber-accent/5 p-5 flex gap-4">
              <Star className="size-5 text-amber-accent flex-none mt-1" />
              <div className="text-foam/80">
                <strong className="text-foam">Você termina com</strong>{" "}
                Pipeline público no GitHub · Dashboard ao vivo · Certificado
                de conclusão
              </div>
            </div>
          </div>
        </section>

        {/* DIFERENCIAIS */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Por que aqui
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-12">
              Por que este curso e não outro:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DIFERENCIAIS.map((d) => (
                <div
                  key={d.n}
                  className="rounded-2xl border border-slate/60 bg-deep p-7"
                >
                  <div className="text-cyan-brand font-mono text-sm mb-3">
                    {d.n}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{d.title}</h3>
                  <p className="text-foam/70 leading-relaxed">{d.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PARA QUEM */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Fit do aluno
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-12">
              Pra quem é — e pra quem{" "}
              <span className="text-brand-gradient">NÃO</span> é.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-cyan-brand/40 bg-cyan-brand/5 p-7">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Check className="size-5 text-cyan-brand" />
                  Este curso foi feito pra você se…
                </h3>
                <ul className="space-y-2.5">
                  {PARA_QUEM_SIM.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-foam/80 leading-relaxed"
                    >
                      <Check className="size-4 text-cyan-brand flex-none mt-1" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate/60 bg-deep p-7">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <XIcon className="size-5 text-foam/50" />
                  Este curso NÃO é pra você se…
                </h3>
                <ul className="space-y-2.5">
                  {PARA_QUEM_NAO.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-foam/70 leading-relaxed"
                    >
                      <XIcon className="size-4 text-foam/40 flex-none mt-1" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PRÉ-REQUISITOS */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Checklist técnico
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-10">
              O que você precisa pra começar:
            </h2>
            <ul className="space-y-3">
              {PREREQS.map((p) => (
                <li
                  key={p.strong}
                  className="flex gap-3 rounded-xl border border-slate/60 bg-deep p-5"
                >
                  <Check className="size-5 text-cyan-brand flex-none mt-0.5" />
                  <div className="text-foam/80">
                    <strong className="text-foam">{p.strong}</strong>{" "}
                    {p.rest}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* BÔNUS */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Tudo que vem junto
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-12">
              Além do curso, você leva:
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {BONUS.map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl border border-slate/60 bg-deep p-6"
                >
                  <Star className="size-5 text-amber-accent mb-3" />
                  <h4 className="font-semibold mb-2">{b.title}</h4>
                  <p className="text-sm text-foam/70 leading-relaxed">
                    {b.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INVESTIMENTO */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              O investimento — Turma 1 Comunidade
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              Preço de comunidade ·{" "}
              <span className="text-brand-gradient">3 lotes</span> +
              referência de mercado
            </h2>
            <p className="text-foam/70 mb-12 max-w-3xl text-lg">
              A Turma 1 é oferecida em primeira mão pra base do{" "}
              <strong className="text-foam">DSSBR</strong> e do{" "}
              <strong className="text-foam">GUBigData</strong>. A partir da
              Turma 2 (set/2026), o curso volta ao preço de mercado.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {LOTES.map((l) => (
                <div
                  key={l.badge}
                  className={
                    l.destaque
                      ? "rounded-2xl border-2 border-cyan-brand bg-cyan-brand/5 p-6 flex flex-col relative"
                      : l.disabled
                      ? "rounded-2xl border border-slate/40 bg-deep/40 p-6 flex flex-col opacity-60"
                      : "rounded-2xl border border-slate/60 bg-deep p-6 flex flex-col"
                  }
                >
                  {l.destaque && (
                    <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-cyan-brand px-3 py-1 text-xs font-medium text-ink">
                      <Sparkles className="size-3" /> Recomendado
                    </div>
                  )}
                  <div className="text-xs uppercase tracking-[0.15em] text-cyan-brand mb-3">
                    {l.badge}
                  </div>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-sm text-foam/60">R$</span>
                    <span className="text-4xl font-semibold">{l.preco}</span>
                  </div>
                  <div className="text-sm text-foam/60 mb-5">{l.vagas}</div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {l.features.map((f) => (
                      <li
                        key={f}
                        className="flex gap-2 text-sm text-foam/80 leading-relaxed"
                      >
                        <Check className="size-3.5 text-cyan-brand flex-none mt-1" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {l.cta && (
                    <Link
                      href={l.cta.href}
                      className="group mb-3 inline-flex items-center justify-center gap-2 rounded-md bg-cyan-brand px-4 py-3 text-sm font-medium text-ink hover:bg-mist transition-colors"
                    >
                      {l.cta.label}
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  )}
                  <div className="text-xs text-foam/50">{l.status}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-amber-accent/30 bg-amber-accent/5 p-5 flex gap-4">
              <Star className="size-5 text-amber-accent flex-none mt-1" />
              <p className="text-foam/80 leading-relaxed">
                <strong className="text-foam">
                  Bônus exclusivo da Turma 1:
                </strong>{" "}
                todo aluno recebe ingresso completo pro{" "}
                <strong className="text-foam">
                  Data Science Summit Brasil 2026
                </strong>{" "}
                (27-29 out, IEP Curitiba) — valor pré-venda{" "}
                <strong className="text-foam">R$ 520</strong>. Este bônus
                não existe nas próximas turmas.
              </p>
            </div>
          </div>
        </section>

        {/* GARANTIA */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <Shield className="size-12 text-cyan-brand mx-auto mb-6" />
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Risco zero
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
              7 dias de garantia incondicional.
            </h2>
            <p className="text-lg text-foam/80 leading-relaxed mb-8">
              Participe da primeira semana inteira. Se achar que não é pra
              você, devolvemos{" "}
              <strong className="text-foam">
                100% do seu investimento
              </strong>
              . Sem pergunta, sem fricção, sem ressentimento.
            </p>
            <blockquote className="text-xl text-cyan-brand italic">
              &ldquo;A gente só fica com seu dinheiro se você ficar com o
              conhecimento.&rdquo;
            </blockquote>
          </div>
        </section>

        {/* PRÓXIMA TURMA */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Calendário
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-10">
              Turma 1 começa em{" "}
              <span className="text-brand-gradient">22 de junho de 2026</span>
            </h2>
            <div className="rounded-2xl border border-slate/60 bg-deep p-8">
              <ul className="space-y-3">
                {[
                  "40 vagas no total, distribuídas em 3 lotes (Founder · L1 · L2)",
                  "Encontros ao vivo às terças, das 19h às 21h",
                  "5 semanas de duração total",
                  "Material de apoio liberado no dia 0",
                  "Bônus desta turma: ingresso DSSBR 2026 incluso",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-foam/80 leading-relaxed"
                  >
                    <Calendar className="size-4 text-cyan-brand flex-none mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 md:py-32 border-b border-slate/30">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Dúvidas comuns
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-10">
              Perguntas frequentes
            </h2>
            <div className="space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-slate/60 bg-deep open:border-cyan-brand/60 transition-colors"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 list-none">
                    <span className="font-medium text-foam">{item.q}</span>
                    <span className="flex-none text-cyan-brand text-xl leading-none transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-foam/70 leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL — landing + ementa + contato */}
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
              Pronto pra parar de só falar de Lakehouse —
              <br />
              <span className="text-brand-gradient">
                e começar a construir um?
              </span>
            </h2>
            <p className="text-lg text-foam/70 max-w-2xl mx-auto mb-10">
              Turma 1 (Comunidade): 22 de junho de 2026 · Lote 1 com 15
              vagas · Bônus DSSBR exclusivo · 7 dias de garantia.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/lakehouse-comunidade/inscricao?utm_source=produtos&utm_medium=cta-final&utm_campaign=lakehouse-t1-l1"
                className="group inline-flex items-center gap-2 rounded-md bg-cyan-brand px-7 py-4 text-base font-medium text-ink hover:bg-mist transition-colors"
              >
                Garantir minha vaga
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="/lakehouse-comunidade/"
                className="inline-flex items-center gap-2 rounded-md border border-slate/80 bg-deep/40 backdrop-blur-sm px-7 py-4 text-base font-medium hover:border-cyan-brand/60 transition-all"
              >
                Ver landing completa
                <ExternalLink className="size-4" />
              </a>
              <a
                href="/lakehouse-comunidade/ementa.html"
                className="inline-flex items-center gap-2 rounded-md border border-slate/80 bg-deep/40 backdrop-blur-sm px-7 py-4 text-base font-medium hover:border-cyan-brand/60 transition-all"
              >
                <FileText className="size-4" />
                Ementa detalhada
              </a>
            </div>
          </div>
        </section>

        <Cta />
      </main>
      <Footer />
    </>
  );
}
