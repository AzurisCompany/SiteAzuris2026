import Link from "next/link";
import { ArrowRight, Sparkles, Ticket } from "lucide-react";

/**
 * Banner de chamada do curso Lakehouse na home — card elevado com borda cyan e
 * brilho de marca, pra destacar do fundo dark da página (antes era full-bleed
 * dark-sobre-dark e "sumia"). Diferente do CourseCallout (bloco menor reusado
 * em blog/serviços): aqui é a vitrine principal do produto.
 */

const STACK = ["MinIO", "Apache Iceberg", "Spark", "Airflow", "Superset"];

export function CourseBanner() {
  return (
    {/* id/aria sem a palavra "banner": adblocks escondem [id*="banner"] via filtro cosmético */}
    <section aria-labelledby="curso-lakehouse-home" className="relative px-6 py-16">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-cyan-brand/40 bg-slate/40 shadow-2xl shadow-cyan-brand/10">
        {/* Sheen + glows de marca */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-brand/12 via-transparent to-violet-accent/12"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-10 size-72 rounded-full bg-cyan-brand/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-12 size-72 rounded-full bg-violet-accent/15 blur-3xl"
        />

        <div className="relative grid gap-10 p-8 md:grid-cols-[1.4fr_1fr] md:items-center md:p-12">
          {/* Coluna texto */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-brand/40 bg-cyan-brand/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-cyan-brand">
              <Sparkles className="size-3.5" /> Curso · turma de lançamento
            </div>

            <h2
              id="curso-lakehouse-home"
              className="mt-4 text-2xl font-semibold tracking-tight md:text-4xl"
            >
              Lakehouse: Pipeline na Prática
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-foam/80 md:text-base">
              5 semanas ao vivo construindo um pipeline de dados completo — do ingest ao
              dashboard. Hands-on de verdade, com portfólio público no GitHub no fim.
            </p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {STACK.map((t) => (
                <li
                  key={t}
                  className="rounded-md border border-slate/80 bg-ink/50 px-2.5 py-1 text-xs text-foam/75"
                >
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/lakehouse-comunidade/inscricao?utm_source=home&utm_medium=destaque&utm_campaign=lakehouse-t1-l1"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-brand px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-mist"
              >
                Garantir vaga <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/lakehouse-comunidade/"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-brand/40 bg-cyan-brand/10 px-6 py-3 text-sm font-semibold text-cyan-brand transition-colors hover:bg-cyan-brand/20"
              >
                Ver o curso e as turmas
              </Link>
            </div>
          </div>

          {/* Coluna preço/bônus */}
          <div className="rounded-2xl border border-cyan-brand/25 bg-ink/70 p-6 backdrop-blur">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-widest text-text-muted">
                  Lote 1 · aberto
                </div>
                <div className="mt-1 text-3xl font-black">R$ 550</div>
              </div>
              <span className="rounded-full bg-emerald-accent/15 px-3 py-1 text-xs font-semibold text-emerald-accent">
                vagas limitadas
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-foam/80">
              <div className="flex items-center gap-2">
                <span className="text-cyan-brand">●</span> Pix à vista{" "}
                <strong className="text-foam">R$ 522,50</strong> (5% off)
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-brand">●</span> ou em até 5x no cartão
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="size-4 shrink-0 text-cyan-brand" /> Ingresso DSSBR 2026
                incluso (R$ 520)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
