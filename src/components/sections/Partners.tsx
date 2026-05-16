import Image from "next/image";

type Partner = {
  name: string;
  href: string;
  logo: string;
  /** tailwind sizing for the logo image; tweak per asset */
  imgClass?: string;
  blurb: string;
};

const PARTNERS: Partner[] = [
  {
    name: "Snowflake",
    href: "https://www.snowflake.com/pt_br/",
    logo: "/partners/snowflake.svg",
    imgClass: "h-12 w-12",
    blurb: "AI Data Cloud — camada de delivery analítico em produção",
  },
  {
    name: "Acceldata",
    href: "https://www.acceldata.io/",
    logo: "/partners/acceldata.svg",
    imgClass: "h-7 w-auto",
    blurb: "Data observability — confiabilidade de pipeline em escala",
  },
  {
    name: "Gaio Data OS",
    href: "https://gaiodataos.com/",
    logo: "/partners/gaio.svg",
    imgClass: "h-10 w-auto",
    blurb: "Plataforma de dados pronta para regulação e governança",
  },
];

export function Partners() {
  return (
    <section className="relative py-20 md:py-28 bg-deep/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-12">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
            Parceiros
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Trabalhamos com quem
            <br />
            <span className="text-brand-gradient">faz o mercado.</span>
          </h2>
          <p className="mt-4 text-foam/60 text-lg">
            Parcerias técnicas que nos dão acesso a roadmap, suporte e
            certificação. Você ganha tempo, performance e SLA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PARTNERS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border border-slate/60 bg-ink/60 p-7 hover:border-cyan-brand/50 hover:bg-deep transition-all"
            >
              <div className="h-14 flex items-center mb-5">
                <Image
                  src={p.logo}
                  alt={p.name}
                  width={200}
                  height={56}
                  className={`${p.imgClass ?? "h-8 w-auto"} object-contain`}
                  style={{ width: "auto" }}
                />
              </div>
              <div className="text-lg font-semibold mb-2">{p.name}</div>
              <p className="text-sm text-foam/60 leading-relaxed">{p.blurb}</p>
              <div
                className="pointer-events-none absolute -bottom-16 -right-16 size-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity"
                style={{
                  background:
                    "radial-gradient(circle, #14b7de 0%, transparent 70%)",
                }}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
