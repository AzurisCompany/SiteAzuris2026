import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Product = {
  name: string;
  tagline: string;
  href: string;
  external?: boolean;
  badge?: string;
  className?: string;
  emoji?: string;
  /** path under /public to a hero image for the card */
  image?: string;
};

const PRODUCTS: Product[] = [
  {
    name: "DSSBR 2026",
    tagline:
      "Data Science Summit Brasil — uma das maiores conferências de Dados & IA do país. Fundada e curada pela Azuris. 27 a 29 de outubro, Curitiba.",
    href: "/dssbr-2026",
    badge: "🎟️ Pré-venda aberta",
    className: "md:col-span-2 md:row-span-2",
    emoji: "🇧🇷",
    image: "https://dssbr.com.br/assets/photos/dss2025-012.jpg",
  },
  {
    name: "English Talk Time",
    tagline: "Inglês com IA — feito por quem ama dados e detesta sotaque ruim.",
    href: "https://englishtalktime.com.br",
    external: true,
    emoji: "🗣️",
  },
  {
    name: "OWorkshop",
    tagline: "Workshops práticos. Sem firula, sem PowerPoint.",
    href: "https://oworkshop.com.br",
    external: true,
    emoji: "🛠️",
  },
  {
    name: "TTSpeak",
    tagline:
      "Videochamada com superpoderes de facilitação: breakout inteligente, transcrição por locutor e white-label. Entra por link, sem instalar app.",
    href: "https://ttspeak.com.br",
    external: true,
    badge: "✨ Novo",
    emoji: "🎥",
  },
  {
    name: "PolenAI",
    tagline:
      "Marketing AI-first. Descreve a campanha em português; a IA monta e-mail, landing, social e automação — multi-canal, com a sua voz de marca.",
    href: "https://polenai.com.br",
    external: true,
    badge: "✨ Novo",
    emoji: "🐝",
  },
  {
    name: "Lakehouse: Pipeline na Prática",
    tagline:
      "5 semanas hands-on. MinIO + Iceberg + Spark + Airflow + Superset. Turma 1 começa 22/jun/2026.",
    href: "/produtos/curso-pipelines",
    badge: "🔥 Turma 1 aberta",
    className: "md:col-span-2",
    emoji: "🚀",
  },
  {
    name: "PipeZeroOne",
    tagline:
      "CRM AI-first. Enriquece o lead, escreve a proposta e prioriza o pipeline. A IA faz o trabalho pesado — você fecha o negócio.",
    href: "https://pipezeroone.com.br",
    external: true,
    badge: "✨ Novo",
    className: "md:col-span-2",
    emoji: "⚡",
  },
];

export function Ecosystem() {
  return (
    <section className="relative py-24 md:py-32 bg-ink">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
            Ecossistema
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Um ecossistema para quem
            <br /> vive de dados.
          </h2>
          <p className="mt-4 text-foam/60 text-lg">
            Conferência, treinamentos e produtos de software — dados, vídeo, IA
            para marketing e vendas. Tudo conectado pelo mesmo padrão: software
            em produção, não em PDF.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 auto-rows-[200px]">
          {PRODUCTS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target={p.external ? "_blank" : undefined}
              rel={p.external ? "noopener noreferrer" : undefined}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-slate/60",
                "bg-gradient-to-br from-deep to-ink",
                "p-6 flex flex-col justify-between",
                "hover:border-cyan-brand/60 hover:from-slate hover:to-deep",
                "transition-all duration-300",
                p.className,
              )}
            >
              {/* Optional background image for hero cards */}
              {p.image ? (
                <div className="absolute inset-0 -z-0 opacity-20 group-hover:opacity-30 transition-opacity">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/80 to-transparent" />
                </div>
              ) : null}

              {/* Decorative gradient on hover */}
              <div
                className="absolute -top-20 -right-20 size-56 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, #14b7de 0%, transparent 70%)",
                }}
              />

              <div className="relative">
                {p.badge ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-accent bg-amber-accent/10 border border-amber-accent/30 rounded-full px-2.5 py-1 mb-3">
                    <Sparkles className="size-3" /> {p.badge}
                  </span>
                ) : null}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{p.emoji}</span>
                  <h3 className="text-xl md:text-2xl font-semibold">
                    {p.name}
                  </h3>
                </div>
                <p className="text-sm md:text-base text-foam/70 max-w-md leading-relaxed">
                  {p.tagline}
                </p>
              </div>

              <div className="relative flex items-center justify-between mt-4">
                <span className="text-xs text-foam/40 uppercase tracking-wider">
                  {p.external ? "site externo" : "saiba mais"}
                </span>
                <ArrowUpRight className="size-5 text-foam/40 group-hover:text-cyan-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
