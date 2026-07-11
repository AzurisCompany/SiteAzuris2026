'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShieldCheck } from 'lucide-react'

/** Linha de ingresso do card lateral (disponibilidade já resolvida no servidor). */
export interface TicketOption {
  tipo_id: string
  nome: string
  gratuito: boolean
  precoReais: number
  maxParcelas: number
  vendasAte: string | null // dd/mm/aaaa
  disponivel: boolean
  motivo: 'encerrado' | 'esgotado' | null
}

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

// Card de ingressos no padrão marketplace: nome + preço + prazo à esquerda,
// stepper −/0/+ à direita, botão verde embaixo. A inscrição é individual
// (1 ingresso por pessoa), então o stepper vai de 0 a 1 e selecionar um tipo
// zera o outro — quem quiser mais de um repete o processo.
export default function TicketBox({ tickets }: { tickets: TicketOption[] }) {
  const router = useRouter()
  const [selecionado, setSelecionado] = useState<string | null>(null)

  const sel = tickets.find((t) => t.tipo_id === selecionado) ?? null

  function incrementar(t: TicketOption) {
    if (!t.disponivel) return
    setSelecionado(t.tipo_id)
  }
  function decrementar(t: TicketOption) {
    if (selecionado === t.tipo_id) setSelecionado(null)
  }

  function comprar() {
    if (!sel) return
    router.push(`/gubigdata/inscricao?tipo=${encodeURIComponent(sel.tipo_id)}`)
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold">Ingressos</h2>
        <p className="mt-2 text-sm text-slate-600">As vendas abrem em breve.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-bold">Ingressos</h2>
        <p className="mt-0.5 text-xs text-slate-500">Escolha uma opção</p>
      </div>

      <div className="divide-y divide-slate-100">
        {tickets.map((t) => {
          const qtd = selecionado === t.tipo_id ? 1 : 0
          return (
            <div key={t.tipo_id} className={`flex items-center justify-between gap-3 px-5 py-4 ${t.disponivel ? '' : 'opacity-50'}`}>
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-snug">{t.nome}</div>
                {t.gratuito ? (
                  <div className="mt-0.5 text-sm font-bold text-emerald-700">Grátis</div>
                ) : (
                  <>
                    <div className="mt-0.5 text-sm font-bold text-slate-800">{brl(t.precoReais)}</div>
                    {t.maxParcelas > 1 && <div className="text-xs font-medium text-emerald-700">em até {t.maxParcelas}x</div>}
                  </>
                )}
                <div className="mt-1 text-xs text-slate-500">
                  {!t.disponivel
                    ? t.motivo === 'esgotado'
                      ? 'Ingressos esgotados'
                      : 'Vendas encerradas'
                    : t.vendasAte
                      ? `Vendas até ${t.vendasAte}`
                      : 'Vagas limitadas'}
                </div>
              </div>

              {/* Stepper 0/1 */}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label={`Remover ${t.nome}`}
                  onClick={() => decrementar(t)}
                  disabled={qtd === 0}
                  className="flex size-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-colors hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-4 text-center text-sm font-semibold tabular-nums">{qtd}</span>
                <button
                  type="button"
                  aria-label={`Adicionar ${t.nome}`}
                  onClick={() => incrementar(t)}
                  disabled={!t.disponivel || qtd === 1}
                  className="flex size-8 items-center justify-center rounded-full border border-emerald-600 text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-3 border-t border-slate-200 px-5 py-4">
        {sel && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">1x {sel.nome}</span>
            <span className="font-bold">{sel.gratuito ? 'Grátis' : brl(sel.precoReais)}</span>
          </div>
        )}
        <button
          type="button"
          onClick={comprar}
          disabled={!sel}
          className="w-full rounded-lg bg-emerald-600 px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {sel?.gratuito ? 'Inscrever-se' : 'Comprar ingressos'}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
          <ShieldCheck className="size-3.5" /> Compra segura · PIX ou cartão em até 3x
        </p>
      </div>
    </div>
  )
}
