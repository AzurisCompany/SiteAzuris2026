import cv from "@/lib/cv.json";

export function Stack() {
  const s = cv.stack;
  const all = [
    ...s.clouds,
    ...s.lakehouse,
    ...s.hadoop,
    ...s.orchestration,
    ...s.streaming,
    ...s.queryEngines,
    ...s.languages,
    ...s.ai,
  ];
  // duplicate for seamless marquee
  const row = [...all, ...all];

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

      <div className="relative">
        {/* edge fades */}
        <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-deep to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-deep to-transparent" />

        <div className="flex marquee whitespace-nowrap">
          {row.map((tech, i) => (
            <span
              key={`${tech}-${i}`}
              className="inline-flex items-center px-5 py-2 mx-1 rounded-full border border-slate/60 bg-ink/60 text-sm font-mono text-foam/70 hover:text-cyan-brand hover:border-cyan-brand/50 transition-colors"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
