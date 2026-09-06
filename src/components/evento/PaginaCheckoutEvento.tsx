import { CalendarDays, MapPin } from 'lucide-react'
import { getProduto } from '@/lib/produtos'
import type { EventoPresencial, MarcaEvento } from '@/lib/eventos/tipos'
import InscricaoEventoForm, { type TipoGuOption } from './InscricaoEventoForm'

// Checkout de um evento presencial — mesmo tema CLARO da página do evento, pra
// experiência de marketplace seguir até o pagamento. Serve qualquer evento
// ([[eventos/tipos]]); o que muda é o `evento` e a `marca`. Nenhuma rota escrita
// aqui dentro: o destino sai de `evento.baseUrl` e `evento.apiUrl`.

export default function PaginaCheckoutEvento({
  evento,
  marca,
  tipos,
  tipoPre,
}: {
  evento: EventoPresencial
  marca: MarcaEvento
  tipos: TipoGuOption[]
  tipoPre: string | null
}) {
  const produto = getProduto(evento.slug)

  return (
    <main className="min-h-screen bg-[#F4F5F7] text-slate-900">
      {/* Top bar igual à página do evento (logos têm traços brancos) */}
      <header style={{ backgroundColor: marca.corHeader }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href={evento.baseUrl} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG local, não passa pelo otimizador */}
            <img src={marca.logo} alt={marca.nome} className="h-9 w-auto" />
          </a>
          <span className="text-xs font-medium text-slate-300">{marca.etiqueta}</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
        <a href={produto.voltarUrl} className="text-sm text-slate-500 transition-colors hover:text-emerald-700">
          {produto.voltarLabel}
        </a>

        {/* Resumo do evento */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold leading-snug sm:text-2xl">
            {`${evento.tituloCurto} — ${evento.dataTitulo}`}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{evento.chamada}</p>
          <div className="mt-3 flex flex-col gap-1.5 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-emerald-600" />
              {`${evento.dataLonga} · a partir das ${evento.inicio}`}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-emerald-600" />
              {`${evento.local.sigla} — ${evento.local.endereco}`}
            </div>
          </div>
        </div>

        {tipos.length > 0 ? (
          <InscricaoEventoForm evento={evento} tipos={tipos} defaultTipo={tipoPre} />
        ) : (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            As inscrições abrem em breve. Enquanto isso, acompanha o{' '}
            <a href={marca.site} className="font-semibold text-emerald-700 underline">
              {marca.siteRotulo}
            </a>
            .
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          Evento de {marca.nome}. Inscrição processada pela infraestrutura da Azuris; pagamento (quando houver) via
          Asaas. Seus dados são usados só pra credenciamento e contato sobre o evento.
        </p>
      </div>
    </main>
  )
}
