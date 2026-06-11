import { ArrowRight } from "lucide-react";

/**
 * Bloco de chamada pro curso Lakehouse: Pipeline na Prática.
 * Reusado em posts de blog de tema data/lakehouse, /servicos e onde fizer sentido —
 * concentra link interno na página que converte (/lakehouse-comunidade/).
 */
export function CourseCallout({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`rounded-2xl border border-cyan-brand/30 bg-gradient-to-br from-deep to-ink p-6 md:p-8 ${className}`}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-2">
        Curso · turma de lançamento
      </div>
      <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
        Construa um Lakehouse de verdade — do zero ao dashboard
      </h3>
      <p className="mt-3 text-sm md:text-base text-foam/75 leading-relaxed">
        No <strong className="text-foam">Lakehouse: Pipeline na Prática</strong> você monta um
        pipeline completo com MinIO, Apache Iceberg, Spark, Airflow e Superset em 5 semanas, ao
        vivo. Hands-on de verdade, portfólio público no fim.
      </p>
      <a
        href="/lakehouse-comunidade/"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-brand/15 border border-cyan-brand/40 px-5 py-2.5 text-sm font-semibold text-cyan-brand hover:bg-cyan-brand/25 transition-colors"
      >
        Ver o curso e as turmas
        <ArrowRight className="size-4" />
      </a>
    </aside>
  );
}
