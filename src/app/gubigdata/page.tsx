import type { Metadata } from 'next'
import Image from 'next/image'
import { CalendarDays, MapPin } from 'lucide-react'
import { getProduto } from '@/lib/produtos'
import { hojeBRT } from '@/lib/format'
import {
  listarTiposAtivos,
  contarInscritosPorTipo,
  disponibilidadeDoTipo,
  precosDoTipo,
  ehGratuito,
} from '@/lib/tipos-ingresso'
import TicketBox, { type TicketOption } from './TicketBox'

// Página de evento no padrão de marketplace (banner → título/data/local →
// descrição à esquerda + card de ingressos sticky à direita). Tema CLARO de
// propósito — é a cara de página de venda de ingresso que o público já conhece.
const PRODUTO = getProduto('gubigdata-2026-07')

const TITULO = 'Encontro Presencial GU Big Data & IA – 30 de julho: conhecimento como ativo e IA como infraestrutura'

export const metadata: Metadata = {
  title: `${TITULO} | Eventos GU BigData & IA`,
  description:
    'Dia 30/07 às 18h30 no IEP, Curitiba: palestras de Tatiana Cruz e Maicon Wendhausem, networking e comunidade. Ingresso Geral R$ 30 · gratuito para associados IEP, GU BigData e participantes DSS.',
  openGraph: {
    title: TITULO,
    description: 'Palestras, troca de experiências e networking — 30/07, 18h30, IEP Curitiba.',
    type: 'website',
    images: [{ url: '/gubigdata/banner-julho.png', width: 1731, height: 909 }],
  },
  alternates: { canonical: '/gubigdata' },
}

export const dynamic = 'force-dynamic'

const AGENDA: Array<{ hora: string; item: string }> = [
  { hora: '18h30', item: 'Credenciamento e networking' },
  { hora: '19h00', item: 'Abertura — GU Big Data & IA' },
  { hora: '19h15', item: 'Palestra: Como transformar conhecimento em ativos de alto valor na era da IA — Tatiana Cruz' },
  { hora: '20h00', item: 'Palestra: O Servidor de IA Corporativo — IA como infraestrutura, não promessa — Maicon Wendhausem' },
  { hora: '21h00', item: 'Encerramento, networking e fotos' },
  { hora: '21h20', item: 'Jantar opcional' },
]

export default async function EventoGuPage() {
  let tickets: TicketOption[] = []
  try {
    const [tipos, inscritos] = await Promise.all([
      listarTiposAtivos(PRODUTO.slug),
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
      {/* Top bar do "marketplace" da comunidade */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="https://gubigdata.com.br" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG local, não passa pelo otimizador */}
            <img src="/gubigdata/logo-gu-bigdata.svg" alt="GU BigData & IA" className="h-9 w-auto" />
          </a>
          <span className="text-xs font-medium text-slate-500">Eventos da comunidade</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Banner */}
        <div className="overflow-hidden rounded-xl shadow-sm">
          <Image
            src="/gubigdata/banner-julho.png"
            alt="Encontro Presencial GU Big Data & IA — 30 de julho"
            width={1731}
            height={909}
            priority
            className="h-auto w-full"
          />
        </div>

        {/* Título / data / local */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold leading-snug sm:text-2xl">{TITULO}</h1>
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-emerald-600" />
              <span>
                <strong className="font-semibold text-slate-800">30 de julho de 2026, quinta</strong> · 18h30 às 21h20
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-emerald-600" />
              <span>
                <strong className="font-semibold text-slate-800">IEP — Instituto de Engenharia do Paraná</strong> · Rua
                Emiliano Perneta, 174 · Centro, Curitiba/PR
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
                <p>
                  O encontro de 30 de julho coloca lado a lado duas visões complementares de geração de valor na era da
                  IA: como transformar o que você sabe em ativos de alto valor — e como transformar a IA em
                  infraestrutura corporativa de verdade, com segurança, controle de custos e escala.
                </p>
                <p>
                  Na primeira palestra, <strong>Tatiana Cruz</strong> mostra como converter experiência, conhecimento e
                  repertório profissional em algo estruturado, escalável e relevante — usando a IA como parceira pra
                  organizar insights, ganhar autoridade e acelerar a criação de soluções.
                </p>
                <p>
                  Na segunda, <strong>Maicon Wendhausem</strong> apresenta o Servidor de IA Corporativo: acesso
                  centralizado a modelos, governança de custos, gestão de usuários, segurança e o caminho de
                  implantação de uma infraestrutura de IA segura, controlada e escalável.
                </p>
                <p>
                  Como todo encontro do GU, o formato é conteúdo + troca de experiências + networking com líderes,
                  especialistas e a comunidade de dados de Curitiba.
                </p>
              </div>

              <h3 className="mt-6 text-base font-bold">Programação</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {AGENDA.map((a) => (
                  <li key={a.hora} className="flex gap-3">
                    <span className="w-12 shrink-0 font-semibold text-emerald-700">{a.hora}</span>
                    <span>{a.item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Palestrantes */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Palestrantes</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div className="flex items-start gap-4">
                  <Image
                    src="/gubigdata/tatiana.jpeg"
                    alt="Tatiana Cruz"
                    width={64}
                    height={64}
                    className="size-16 shrink-0 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">Tatiana Cruz</div>
                    <p className="mt-1 text-sm text-slate-600">
                      Como transformar conhecimento em ativos de alto valor na era da IA.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Image
                    src="/gubigdata/maicon.jpeg"
                    alt="Maicon Wendhausem"
                    width={64}
                    height={64}
                    className="size-16 shrink-0 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">Maicon Wendhausem</div>
                    <p className="mt-1 text-sm text-slate-600">
                      O Servidor de IA Corporativo — IA como infraestrutura, não promessa.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Local */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Local</h2>
              <p className="mt-2 text-sm text-slate-700">
                <strong>IEP — Instituto de Engenharia do Paraná</strong>
                <br />
                Rua Emiliano Perneta, 174 — Centro, Curitiba/PR
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=IEP+Instituto+de+Engenharia+do+Paran%C3%A1+Rua+Emiliano+Perneta+174+Curitiba"
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
                {/* eslint-disable-next-line @next/next/no-img-element -- logo SVG local */}
                <img src="/gubigdata/logo-gu-bigdata.svg" alt="GU BigData & IA" className="h-10 w-auto max-w-[220px]" />
                <p className="min-w-0 text-sm text-slate-600">
                  O <strong>GU Big Data &amp; IA</strong>
                  {' é o grupo de usuários de dados e inteligência artificial de Curitiba: encontros mensais, grupos de estudo e networking entre profissionais e entusiastas. Realização deste encontro: GU Big Data & IA · Rede Sol · SUCESU Paraná. '}
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
