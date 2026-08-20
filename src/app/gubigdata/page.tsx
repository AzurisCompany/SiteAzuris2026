import type { Metadata } from 'next'
import Image from 'next/image'
import { CalendarDays, MapPin } from 'lucide-react'
import { getProduto } from '@/lib/produtos'
import { hojeBRT } from '@/lib/format'
import {
  listarTiposPublicos,
  contarInscritosPorTipo,
  disponibilidadeDoTipo,
  precosDoTipo,
  ehGratuito,
} from '@/lib/tipos-ingresso'
import { EVENTO_GU } from './evento'
import TicketBox, { type TicketOption } from './TicketBox'

// Página de evento no padrão de marketplace (banner → título/data/local →
// descrição à esquerda + card de ingressos sticky à direita). Tema CLARO de
// propósito — é a cara de página de venda de ingresso que o público já conhece.
// O conteúdo do encontro corrente mora em ./evento.ts.
const PRODUTO = getProduto(EVENTO_GU.slug)

export const metadata: Metadata = {
  title: `${EVENTO_GU.titulo} | Eventos GU BigData & IA`,
  description:
    'Dia 26/08 às 18h30 no IEP, Curitiba: demonstração do sistema de transmissão do DSSBR com Alessandro Binhara e Process Mining na saúde com Marcelo Dallagassa. Ingresso Geral R$ 30 · gratuito para associados IEP, GU BigData e participantes DSSBR.',
  openGraph: {
    title: EVENTO_GU.titulo,
    description: 'DSSBR ao Vivo e Process Mining na Saúde — 26/08, 18h30, IEP Curitiba.',
    type: 'website',
    images: [{ url: EVENTO_GU.banner.src, width: EVENTO_GU.banner.largura, height: EVENTO_GU.banner.altura }],
  },
  alternates: { canonical: '/gubigdata' },
}

export const dynamic = 'force-dynamic'

export default async function EventoGuPage() {
  let tickets: TicketOption[] = []
  try {
    const [tipos, inscritos] = await Promise.all([
      listarTiposPublicos(PRODUTO.slug),
      contarInscritosPorTipo(PRODUTO.slug),
    ])
    const hoje = hojeBRT()
    tickets = tipos.map((t) => {
      const p = precosDoTipo(t)
      const disp = disponibilidadeDoTipo(t, hoje, inscritos[t.tipo_id] ?? 0)
      return {
        tipo_id: t.tipo_id,
        nome: t.nome,
        gratuito: ehGratuito(t),
        precoReais: p.precoPixReais,
        maxParcelas: p.maxParcelas,
        vendasAte: t.vendas_ate ? t.vendas_ate.split('-').reverse().join('/') : null,
        disponivel: disp.disponivel,
        motivo: disp.motivo,
      }
    })
  } catch {
    tickets = []
  }

  return (
    <main className="min-h-screen bg-[#F4F5F7] text-slate-900">
      {/* Top bar do "marketplace" da comunidade — azul-marinho do site do GU
          (#0A0F1C): o logo tem traços brancos e some em fundo claro. */}
      <header className="bg-[#0A0F1C]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="https://gubigdata.com.br" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG local, não passa pelo otimizador */}
            <img src="/gubigdata/logo-gu-bigdata.svg" alt="GU BigData & IA" className="h-9 w-auto" />
          </a>
          <span className="text-xs font-medium text-slate-300">Eventos da comunidade</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Banner */}
        <div className="overflow-hidden rounded-xl shadow-sm">
          <Image
            src={EVENTO_GU.banner.src}
            alt={EVENTO_GU.banner.alt}
            width={EVENTO_GU.banner.largura}
            height={EVENTO_GU.banner.altura}
            priority
            className="h-auto w-full"
          />
        </div>

        {/* Título / data / local */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {EVENTO_GU.novaData && (
            <span className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              Nova data
            </span>
          )}
          <h1 className="text-xl font-bold leading-snug sm:text-2xl">{EVENTO_GU.titulo}</h1>
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-emerald-600" />
              <span>
                <strong className="font-semibold text-slate-800">{EVENTO_GU.dataLonga}</strong>
                {` · ${EVENTO_GU.horario}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-emerald-600" />
              <span>
                <strong className="font-semibold text-slate-800">{EVENTO_GU.local.nome}</strong>
                {` · ${EVENTO_GU.local.endereco}`}
              </span>
            </div>
          </div>
        </div>

        {/* Conteúdo + ingressos */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Ingressos primeiro no mobile (padrão de página de evento) */}
          <div className="order-1 w-full lg:order-2 lg:w-[380px] lg:shrink-0 lg:sticky lg:top-6">
            <TicketBox tickets={tickets} />
          </div>

          <div className="order-2 min-w-0 flex-1 space-y-6 lg:order-1">
            {/* Descrição */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Descrição do evento</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700">
                {EVENTO_GU.descricao.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>

              <h3 className="mt-6 text-base font-bold">Programação</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {EVENTO_GU.agenda.map((a) => (
                  <li key={a.hora} className="flex gap-3">
                    <span className="w-12 shrink-0 font-semibold text-emerald-700">{a.hora}</span>
                    <span>{a.item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">Horários sujeitos a pequenos ajustes.</p>
            </section>

            {/* Palestrantes */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Quem apresenta</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                {EVENTO_GU.palestrantes.map((p) => (
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

            {/* Local */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Local</h2>
              <p className="mt-2 text-sm text-slate-700">
                <strong>{EVENTO_GU.local.nome}</strong>
                <br />
                {EVENTO_GU.local.detalhe}
                <br />
                {EVENTO_GU.local.endereco}
              </p>
              <a
                href={EVENTO_GU.local.mapsUrl}
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
                <span className="inline-flex rounded-lg bg-[#0A0F1C] px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- logo SVG local */}
                  <img src="/gubigdata/logo-gu-bigdata.svg" alt="GU BigData & IA" className="h-9 w-auto max-w-[200px]" />
                </span>
                <p className="min-w-0 text-sm text-slate-600">
                  O <strong>GU Big Data &amp; IA</strong>
                  {` é o grupo de usuários de dados e inteligência artificial de Curitiba: encontros mensais, grupos de estudo e networking entre profissionais e entusiastas. ${EVENTO_GU.realizacao} `}
                  <a href="https://gubigdata.com.br" className="font-semibold text-emerald-700 hover:underline">
                    gubigdata.com.br
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>

        <p className="mt-8 pb-4 text-center text-xs text-slate-400">
          Evento da comunidade GU BigData &amp; IA · inscrição e pagamento processados pela Azuris via Asaas.
        </p>
      </div>
    </main>
  )
}
