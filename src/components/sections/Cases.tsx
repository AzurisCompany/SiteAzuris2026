import cv from "@/lib/cv.json";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Cases() {
  const featured = cv.cases.slice(0, 4);

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Cases
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Cases reais. Números reais.
            </h2>
            <p className="mt-4 text-foam/60 text-lg">
              Não vendemos discurso. Vendemos plataformas que rodam, migrações
              que entregam, custos que caem.
            </p>
          </div>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 text-sm text-cyan-brand hover:text-mist"
          >
            Ver todos os cases <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featured.map((c) => (
            <article
              key={c.slug}
              className="group relative overflow-hidden rounded-2xl border border-slate/60 bg-deep p-7 md:p-8 hover:border-cyan-brand/50 transition-colors"
            >
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-foam/40">
                  {c.client}
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-semibold leading-snug mb-3">
                {c.title}
              </h3>
              <p className="text-sm text-foam/60 mb-6">{c.tagline}</p>

              {c.kpis ? (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {c.kpis.map((k) => (
                    <div
                      key={k.label}
                      className="rounded-lg border border-slate/50 bg-ink/60 px-3 py-2.5"
                    >
                      <div className="text-2xl font-semibold text-cyan-brand font-mono">
                        {k.value}
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-foam/40 mt-0.5">
                        {k.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-1.5">
                {c.tech?.slice(0, 6).map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate/50 text-foam/50"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
