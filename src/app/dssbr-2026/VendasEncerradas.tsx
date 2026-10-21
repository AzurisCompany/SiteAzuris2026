// Aviso de vendas encerradas do DSS 2026 — FullPass, Estudante e combo FullPass + curso
// fecharam em 08/10/2026; o Business, em 16/10/2026; o VIP, em 21/10/2026. Serve a
// landing e as URLs de checkout que já circularam (`/dssbr-2026/inscricao`,
// `?tipo=estudante`, `/fullpass-curso`, `/business`, `/vip` e os redirects do One Day):
// link velho cai aqui, não num 404. Nenhum ingresso segue à venda no site — quem ainda
// quer ir fala no WhatsApp e vira cobrança avulsa.

const WA_PHONE = '5541998003687' // +55 (41) 99800-3687

export default function VendasEncerradas({
  titulo,
  encerrado = 'FullPass',
  waContexto,
}: {
  titulo: string
  /** o que fechou — vai no texto ("As inscrições do FullPass pelo site estão encerradas") */
  encerrado?: string
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
        As inscrições do <strong className="text-[var(--text-primary)]">{encerrado}</strong> pelo site estão
        encerradas. Ainda quer ir? Fale com a gente no WhatsApp.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
