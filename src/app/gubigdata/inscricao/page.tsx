import type { Metadata } from 'next'
import { CalendarDays, MapPin } from 'lucide-react'
import { getProduto } from '@/lib/produtos'
import { hojeBRT } from '@/lib/format'
import {
  listarTiposPublicos,
  getTipo,
  aplicarTipoDoLink,
  contarInscritosPorTipo,
  disponibilidadeDoTipo,
  precosDoTipo,
  ehGratuito,
} from '@/lib/tipos-ingresso'
import { EVENTO_GU } from '../evento'
import InscricaoGuForm, { type TipoGuOption } from './InscricaoGuForm'

// Checkout do encontro GU BigData — mesmo tema CLARO da página do evento
// (/gubigdata), pra experiência de marketplace seguir até o pagamento.
// Qual encontro está em cartaz é decisão de ../evento.ts.
const PRODUTO = getProduto(EVENTO_GU.slug)

export const metadata: Metadata = {
  title: `Inscrição — Encontro Presencial GU BigData & IA · ${EVENTO_GU.dataCurta}`,
  description:
    'Encontro presencial do GU BigData & IA em 26/08 no IEP, Curitiba. Ingresso Geral R$ 30 (PIX ou cartão em até 3x) ou gratuito para associados.',
  robots: { index: false, follow: false }, // página de checkout; a página do evento é a indexável
}

export const dynamic = 'force-dynamic'

function dataBR(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default async function InscricaoGuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams

  // Tipos da vitrine + disponibilidade (janela de vendas / lotação), tolerante a
  // banco sem migração — nesse caso a página mostra "inscrições em breve".
  let tipoOptions: TipoGuOption[] = []
  let tipoPre: string | null = null
  try {
    const [publicos, inscritos] = await Promise.all([
      listarTiposPublicos(PRODUTO.slug),
      contarInscritosPorTipo(PRODUTO.slug),
    ])
    const hoje = hojeBRT()
    // `?tipo=` pode apontar pra um ingresso oculto (fora da vitrine) — ver [[tipos-ingresso]].
    const doLink = sp.tipo ? await getTipo(PRODUTO.slug, sp.tipo) : null
    const link = aplicarTipoDoLink(publicos, sp.tipo, doLink, hoje, inscritos[doLink?.tipo_id ?? ''] ?? 0)
    tipoPre = link.selecionado
    tipoOptions = link.tipos.map((t) => {
      const p = precosDoTipo(t)
      const disp = disponibilidadeDoTipo(t, hoje, inscritos[t.tipo_id] ?? 0)
      return {
        tipo_id: t.tipo_id,
        nome: t.nome,
        descricao: t.descricao,
        gratuito: ehGratuito(t),
        precoPixReais: p.precoPixReais,
        precoCartaoBaseReais: p.precoCartaoBaseReais,
        maxParcelas: p.maxParcelas,
        vendasAte: t.vendas_ate ? dataBR(t.vendas_ate) : null,
        disponivel: disp.disponivel,
        motivo: disp.motivo,
      }
    })
  } catch {
    tipoOptions = []
  }

  return (
    <main className="min-h-screen bg-[#F4F5F7] text-slate-900">
      {/* Top bar igual à página do evento — azul-marinho do GU (logo tem traços brancos) */}
      <header className="bg-[#0A0F1C]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/gubigdata" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG local, não passa pelo otimizador */}
            <img src="/gubigdata/logo-gu-bigdata.svg" alt="GU BigData & IA" className="h-9 w-auto" />
          </a>
          <span className="text-xs font-medium text-slate-300">Eventos da comunidade</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
        <a href={PRODUTO.voltarUrl} className="text-sm text-slate-500 transition-colors hover:text-emerald-700">
          {PRODUTO.voltarLabel}
        </a>

        {/* Resumo do evento */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold leading-snug sm:text-2xl">
            Encontro Presencial GU Big Data &amp; IA — {EVENTO_GU.dataTitulo}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{EVENTO_GU.chamada}</p>
          <div className="mt-3 flex flex-col gap-1.5 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-emerald-600" />
              {`${EVENTO_GU.dataLonga} · a partir das ${EVENTO_GU.inicio}`}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-emerald-600" />
              {`${EVENTO_GU.local.sigla} — ${EVENTO_GU.local.endereco}`}
            </div>
          </div>
        </div>

        {tipoOptions.length > 0 ? (
          <InscricaoGuForm tipos={tipoOptions} defaultTipo={tipoPre} />
        ) : (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            As inscrições abrem em breve. Enquanto isso, acompanha o{' '}
            <a href="https://gubigdata.com.br" className="font-semibold text-emerald-700 underline">
              site do GU BigData
            </a>
            .
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          Evento da comunidade GU BigData &amp; IA. Inscrição processada pela infraestrutura da Azuris; pagamento (quando
          houver) via Asaas. Seus dados são usados só pra credenciamento e contato sobre o evento.
        </p>
      </div>
    </main>
  )
}
