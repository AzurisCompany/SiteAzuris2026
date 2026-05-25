import { Wrench, Activity, GraduationCap, Package } from "lucide-react";

const PRINCIPLES = [
  {
    icon: Wrench,
    title: "Engenharia primeiro",
    text: "Toda entrega tem SLA, número e responsável. Arquitetura de slide não roda às 3 da manhã — código testado roda.",
  },
  {
    icon: Activity,
    title: "Dados em produção",
    text: "A definição de pronto é pipeline observado em prod. Nada de PoC eterna ou dashboard que ninguém abre.",
  },
  {
    icon: GraduationCap,
    title: "Cultura de mentor",
    text: "Treinamos seu time enquanto entregamos. Saímos quando vocês ficam autônomos — não criamos dependência.",
  },
  {
    icon: Package,
    title: "Produtos próprios",
    text: "DSSBR, ETT, hadoop.com.br. Não somos só consultoria — operamos as mesmas tecnologias que vendemos.",
  },
];

export function HowWeWork() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl mb-14">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
            Como trabalhamos
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Engenharia de dados feita por quem já operou em produção.
          </h2>
          <p className="mt-4 text-foam/70 leading-relaxed">
            Um time multidisciplinar de engenheiros de dados, arquitetos e
            mentores. Cada projeto entra com método, número e prazo — não com
            promessa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRINCIPLES.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="relative rounded-2xl border border-slate/60 bg-deep p-7 hover:border-cyan-brand/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center justify-center size-10 rounded-lg border border-slate/60 bg-ink/60 text-cyan-brand">
                    <Icon className="size-5" />
                  </div>
                  <div className="text-cyan-brand/60 font-mono text-xs">
                    0{i + 1}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-foam/70 leading-relaxed">{p.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
