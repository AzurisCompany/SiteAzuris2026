import { ArrowRight } from 'lucide-react'

// Aviso de vendas encerradas do DSS 2026 — FullPass, Estudante e combo FullPass + curso
// fecharam em 08/10/2026. Serve a landing e as URLs de checkout que já circularam
// (`/dssbr-2026/inscricao`, `?tipo=estudante`, `/fullpass-curso`, e os redirects do
// One Day): link velho cai aqui, não num 404. VIP e Business seguem vendendo — sem
// preço em texto fixo, quem diz o preço é a página de cada um.

const WA_PHONE = '5541998003687' // +55 (41) 99800-3687

const AINDA_A_VENDA = [
  { nome: 'Ingresso VIP', href: '/dssbr-2026/vip' },
  { nome: 'Ingresso Business', href: '/dssbr-2026/business' },
]

export default function VendasEncerradas({
  titulo,
  waContexto,
}: {
  titulo: string
  /** texto que abre a conversa no WhatsApp */
  waContexto: string
}) {
  const wa = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(waContexto)}`
  return (
    <div className="rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6 text-left">
      <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
        DSS 2026 · 27 a 29 de outubro · IEP, Curitiba
      </div>
      <h2 className="mt-2 text-2xl font-bold">{titulo}</h2>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        As inscrições do <strong className="text-[var(--text-primary)]">FullPass</strong> pelo site estão
        encerradas. Ainda quer ir? Fale com a gente no WhatsApp — ou garanta um dos ingressos que ainda
        estão à venda.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {AINDA_A_VENDA.map((i) => (
          <a
            key={i.href}
            href={i.href}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--azuris-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--azuris-cyan)]"
          >
            {i.nome}
            <ArrowRight className="size-4" />
          </a>
        ))}
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
        >
          Falar no WhatsApp
        </a>
      </div>
    </div>
  )
}
