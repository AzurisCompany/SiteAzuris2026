// Aviso de vendas encerradas do DSS 2026 — FullPass, Estudante e combo FullPass + curso
// fecharam em 08/10/2026; o Business, em 16/10/2026; o VIP, em 21/10/2026. Serve a
// landing e as URLs de checkout que já circularam (`/dssbr-2026/inscricao`,
// `?tipo=estudante`, `/fullpass-curso`, `/business`, `/vip` e os redirects do One Day):
// link velho cai aqui, não num 404. Nenhum ingresso segue à venda no site — quem ainda
// quer ir fala no WhatsApp e vira cobrança avulsa.
//
// Desde 04/11/2026 o aviso também vende o DSS 2027 (Pre-Load e combo FullPass + curso):
// todo link velho do 2026 vira porta de entrada do 2027. Preços lidos do registry.
import { getProduto } from '@/lib/produtos'

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
  const preload = getProduto('dss-2027-preload').precoCentavos / 100
  const combo = getProduto('dss-2027-fullpass-curso').precoCentavos / 100
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

      <div className="mt-6 border-t border-[var(--azuris-surface)] pt-5">
        <div className="text-xs uppercase tracking-widest text-[var(--azuris-cyan)]">O DSS 2027 já está à venda</div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Data, local e grade ainda serão anunciados — o FullPass já está à venda antes de abrir qualquer lote.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a
            href="/dssbr-2027/preload"
            className="block rounded-xl border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] p-4 transition-colors hover:border-[var(--azuris-cyan)]"
          >
            <div className="text-sm font-semibold text-[var(--text-primary)]">FullPass Pre-Load</div>
            <div className="text-2xl font-black">R$ {preload}</div>
            <div className="text-xs text-[var(--text-muted)]">ingressos limitados →</div>
          </a>
          <a
            href="/dssbr-2027/fullpass-curso"
            className="block rounded-xl border border-[var(--azuris-cyan)]/40 bg-[var(--azuris-ink)] p-4 transition-colors hover:border-[var(--azuris-cyan)]"
          >
            <div className="text-sm font-semibold text-[var(--text-primary)]">FullPass + Curso Pipeline</div>
            <div className="text-2xl font-black">R$ {combo}</div>
            <div className="text-xs text-[var(--text-muted)]">com a nova turma do curso Lakehouse →</div>
          </a>
        </div>
      </div>
    </div>
  )
}
