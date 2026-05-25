import { TECH_ROWS, techMaskUrl, type Tech } from "@/lib/tech-stack";

const ROW_ANIM = ["marquee", "marquee-reverse", "marquee-slow"];

function TechPill({ tech }: { tech: Tech }) {
  const url = techMaskUrl(tech);
  return (
    <a
      href={tech.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${tech.name} — site oficial`}
      className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 mx-1 rounded-full border border-slate/60 bg-ink/60 text-xs sm:text-sm font-mono text-foam/70 hover:text-cyan-brand hover:border-cyan-brand/50 hover:bg-deep transition-colors"
    >
      <span
        aria-hidden
        className="size-5 sm:size-6 bg-current shrink-0"
        style={{
          WebkitMaskImage: `url("${url}")`,
          maskImage: `url("${url}")`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
      {tech.name}
    </a>
  );
}

export function Stack() {
  return (
    <section className="relative py-20 md:py-24 border-y border-slate/40 bg-deep/40 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 mb-10 text-center">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-2">
          Stack
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold">
          Tecnologias em produção, não em PowerPoint.
        </h2>
      </div>

      <div className="relative space-y-4">
        <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-deep to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-deep to-transparent" />

        {TECH_ROWS.map((row, idx) => {
          const doubled = [...row, ...row];
          return (
            <div key={idx} className="overflow-hidden">
              <div className={`flex ${ROW_ANIM[idx]} whitespace-nowrap w-max`}>
                {doubled.map((tech, i) => (
                  <TechPill key={`${tech.name}-${i}`} tech={tech} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
