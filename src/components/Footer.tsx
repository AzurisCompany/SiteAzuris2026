import Link from "next/link";
import { Logo } from "./Logo";
import cv from "@/lib/cv.json";

const COLS = [
  {
    title: "Azuris",
    links: [
      { label: "Sobre", href: "/sobre" },
      { label: "Cases", href: "/cases" },
      { label: "Blog", href: "/blog" },
      { label: "Contato", href: "/contato" },
    ],
  },
  {
    title: "Ecossistema",
    links: [
      { label: "DSSBR 2026", href: "https://dssbr.com.br", external: true },
      { label: "English Talk Time", href: "https://englishtalktime.com.br", external: true },
      { label: "OWorkshop", href: "https://oworkshop.com.br", external: true },
      { label: "GU BigData", href: "https://gubigdata.com.br", external: true },
    ],
  },
  {
    title: "Aprender",
    links: [
      { label: "Curso Pipelines + IA", href: "/produtos/curso-pipelines" },
      { label: "Grupo de Estudos", href: "https://gubigdata.com.br/grupo-de-estudos/", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-slate/40 bg-deep">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Logo size={56} />
            <p className="mt-4 text-sm text-foam/60 max-w-xs leading-relaxed">
              Engenharia de Dados e IA para empresas que decidem com dados.
              20+ anos transformando lakes, pipelines e modelos em vantagem.
            </p>
            <div className="mt-6 text-sm space-y-1">
              <a
                href={`mailto:${cv.email}`}
                className="block text-foam/70 hover:text-cyan-brand"
              >
                {cv.email}
              </a>
              <span className="block text-foam/40 font-mono">
                {cv.phone}
              </span>
              <span className="block text-foam/40">{cv.location}</span>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-4">
                {col.title}
              </div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {"external" in l && l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-foam/70 hover:text-cyan-brand"
                      >
                        {l.label} ↗
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-foam/70 hover:text-cyan-brand"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-slate/40 flex flex-col md:flex-row gap-3 justify-between items-center text-xs text-foam/40">
          <span>
            © {new Date().getFullYear()} Azuris Cloud Systems. Dados em movimento.
          </span>
          <Link href="/politica-de-privacidade" className="hover:text-foam/70">
            Política de privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
