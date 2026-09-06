import Image from 'next/image'
import { CalendarDays, MapPin } from 'lucide-react'
import type { EventoPresencial, MarcaEvento } from '@/lib/eventos/tipos'
import TicketBox, { type TicketOption } from './TicketBox'

// Página de evento no padrão de marketplace (banner → título/data/local →
// descrição à esquerda + card de ingressos sticky à direita). Tema CLARO de
// propósito — é a cara de página de venda de ingresso que o público já conhece.
//
// Serve QUALQUER evento presencial ([[eventos/tipos]]): as rotas do GU e do café
// são a mesma página com outro `evento` e outra `marca`. Nenhuma rota é escrita
// aqui dentro — quem diz pra onde ir é o `evento.baseUrl`.

export default function PaginaEvento({
  evento,
  marca,
  tickets,
}: {
  evento: EventoPresencial
  marca: MarcaEvento
  tickets: TicketOption[]
}) {
  return (
    <main className="min-h-screen bg-[#F4F5F7] text-slate-900">
      {/* Top bar do "marketplace" do produtor — fundo escuro porque os logos têm
          traços brancos e sumiriam num fundo claro. */}
      <header style={{ backgroundColor: marca.corHeader }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href={marca.site} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG local, não passa pelo otimizador */}
            <img src={marca.logo} alt={marca.nome} className="h-9 w-auto" />
          </a>
          <span className="text-xs font-medium text-slate-300">{marca.etiqueta}</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Banner */}
        <div className="overflow-hidden rounded-xl shadow-sm">
          <Image
            src={evento.banner.src}
            alt={evento.banner.alt}
            width={evento.banner.largura}
            height={evento.banner.altura}
            priority
            className="h-auto w-full"
          />
        </div>

        {/* Título / data / local */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {evento.novaData && (
            <span className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              Nova data
            </span>
          )}
          <h1 className="text-xl font-bold leading-snug sm:text-2xl">{evento.titulo}</h1>
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-emerald-600" />
              <span>
                <strong className="font-semibold text-slate-800">{evento.dataLonga}</strong>
                {` · ${evento.horario}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-emerald-600" />
              <span>
                <strong className="font-semibold text-slate-800">{evento.local.nome}</strong>
                {` · ${evento.local.endereco}`}
              </span>
            </div>
          </div>
        </div>

        {/* Conteúdo + ingressos */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Ingressos primeiro no mobile (padrão de página de evento) */}
          <div className="order-1 w-full lg:order-2 lg:w-[380px] lg:shrink-0 lg:sticky lg:top-6">
            <TicketBox tickets={tickets} checkoutUrl={`${evento.baseUrl}/inscricao`} />
          </div>

          <div className="order-2 min-w-0 flex-1 space-y-6 lg:order-1">
            {/* Descrição */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Descrição do evento</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700">
                {evento.descricao.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>

              <h3 className="mt-6 text-base font-bold">Programação</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {evento.agenda.map((a) => (
                  <li key={a.hora} className="flex gap-3">
                    <span className="w-12 shrink-0 font-semibold text-emerald-700">{a.hora}</span>
                    <span>{a.item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">Horários sujeitos a pequenos ajustes.</p>
            </section>

            {/* Palestrantes — nem todo evento anuncia quem fala (o café anuncia a empresa) */}
            {evento.palestrantes.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold">Quem apresenta</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {evento.palestrantes.map((p) => (
                    <div key={p.nome} className="flex items-start gap-4">
                      <Image
                        src={p.foto}
                        alt={p.nome}
                        width={64}
                        height={64}
                        className="size-16 shrink-0 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold">{p.nome}</div>
                        <p className="mt-1 text-sm text-slate-600">{p.tema}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Local */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Local</h2>
              <p className="mt-2 text-sm text-slate-700">
                <strong>{evento.local.nome}</strong>
                <br />
                {evento.local.detalhe}
                <br />
                {evento.local.endereco}
              </p>
              <a
                href={evento.local.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
              >
                Ver no mapa →
              </a>
            </section>

            {/* Produtor */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Sobre o produtor</h2>
              <div className="mt-3 flex flex-col items-start gap-4 sm:flex-row">
                <span className="inline-flex rounded-lg px-4 py-3" style={{ backgroundColor: marca.corHeader }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- logo SVG local */}
                  <img src={marca.logo} alt={marca.nome} className="h-9 w-auto max-w-[200px]" />
                </span>
                <p className="min-w-0 text-sm text-slate-600">
                  {/* Gotcha do SSR do Next 16: o espaço depois de </strong> some. Vai
                      explícito no início da string. */}
                  <strong>{marca.nome}</strong>
                  {` ${marca.sobre} ${evento.realizacao} `}
                  <a href={marca.site} className="font-semibold text-emerald-700 hover:underline">
                    {marca.site.replace(/^https?:\/\//, '')}
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>

        <p className="mt-8 pb-4 text-center text-xs text-slate-400">
          Evento de {marca.nome} · inscrição e pagamento processados pela Azuris via Asaas.
        </p>
      </div>
    </main>
  )
}
