import { ArrowUpRight, Heart } from "lucide-react";

type Initiative = {
  name: string;
  tagline: string;
  href: string;
  emoji: string;
  meta: string;
};

const INITIATIVES: Initiative[] = [
  {
    name: "Hadoop.com.br",
    tagline:
      "Portal de conteúdo sobre Hadoop e Big Data em PT-BR. Tutoriais, conceitos e referência — criado e mantido pela Azuris, aberto pra qualquer um.",
    href: "https://hadoop.com.br",
    emoji: "🐘",
    meta: "portal de conteúdo",
  },
  {
    name: "GU BigData",
    tagline:
      "Grupo de Usuários de Big Data. Comunidade de engenheiros e cientistas de dados que a Azuris ajuda a organizar e a manter de pé.",
    href: "https://gubigdata.com.br",
    emoji: "👥",
    meta: "grupo de usuários",
  },
  {
    name: "Grupo de Estudos",
    tagline:
      "Toda semana, gratuito e aberto. Engenharia de dados na prática, ao vivo — sem venda no meio, só gente aprendendo junto.",
    href: "https://gubigdata.com.br/grupo-de-estudos/",
    emoji: "📚",
    meta: "encontros semanais",
  },
];

export function Community() {
  return (
    <section className="relative py-24 md:py-32 bg-deep/40">
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-14">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-emerald-accent mb-3">
            <Heart className="size-3.5" /> Comunidade
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Antes de vender,
            <br /> a gente devolve.
          </h2>
          <p className="mt-4 text-foam/60 text-lg">
            Estas não são iniciativas comerciais. É o esforço da Azuris para
            apoiar a comunidade de software brasileira — a mesma que nos formou.
            Conteúdo aberto, encontros gratuitos e um grupo de usuários que segue
            de pé.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {INITIATIVES.map((i) => (
            <a
              key={i.name}
              href={i.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border border-slate/60 bg-gradient-to-br from-deep to-ink p-6 flex flex-col justify-between min-h-[220px] hover:border-emerald-accent/50 hover:from-slate hover:to-deep transition-all duration-300"
            >
              <div
                className="absolute -top-20 -right-20 size-56 rounded-full opacity-0 group-hover:opacity-25 transition-opacity duration-500 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, #10b981 0%, transparent 70%)",
                }}
              />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{i.emoji}</span>
                  <h3 className="text-xl md:text-2xl font-semibold">{i.name}</h3>
                </div>
                <p className="text-sm md:text-base text-foam/70 leading-relaxed">
                  {i.tagline}
                </p>
              </div>

              <div className="relative flex items-center justify-between mt-6">
                <span className="text-xs text-foam/40 uppercase tracking-wider">
                  {i.meta}
                </span>
                <ArrowUpRight className="size-5 text-foam/40 group-hover:text-emerald-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
