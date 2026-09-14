import type { ReactNode } from 'react'
import { Users, Clock } from 'lucide-react'
import type { ProdutoConfig } from '@/lib/produtos'
import { listarTipos, contarInscritosPorTipo, precosDoTipo } from '@/lib/tipos-ingresso'
import { escadaPorQuantidade, type EscadaQuantidade } from '@/lib/lotes-quantidade'
import { hojeBRT } from '@/lib/format'
import InscricaoForm from './inscricao/InscricaoForm'

// Corpo dos checkouts VIP e Business do DSS 2026: lote que vira sozinho por
// quantidade ([[lotes-quantidade]]). A página mostra a escada e vende SÓ o lote
// vigente; o servidor confere de novo no POST (checkout-produto, `tipoObrigatorio`).
const WA_PHONE = '5541998003687' // +55 (41) 99800-3687

interface Props {
  produto: ProdutoConfig
  /** endpoint do POST de inscrição deste produto */
  endpoint: string
  gaItem: { id: string; name: string }
  h1: ReactNode
  subtitulo: ReactNode
  /** rótulo em caixa-alta no topo do card de resumo */
  resumoLabel: string
  /** o que está incluído no ingresso */
  inclui: string[]
  /** contexto pra prefill do WhatsApp (grupo, esgotado, dúvida) */
  waContexto: string
}

const brl = (reais: number) => reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function CheckoutPorLotes({
  produto,
  endpoint,
  gaItem,
  h1,
  subtitulo,
  resumoLabel,
  inclui,
  waContexto,
}: Props) {
  let escada: EscadaQuantidade | null = null
  try {
    const [tipos, inscritos] = await Promise.all([listarTipos(produto.slug), contarInscritosPorTipo(produto.slug)])
    escada = escadaPorQuantidade(tipos, inscritos, hojeBRT())
  } catch {
    // Banco fora: sem lote não há o que vender (o servidor recusaria) — a página
    // avisa e manda pro WhatsApp em vez de mostrar um preço que ninguém confirma.
    escada = null
  }

  const vigente = escada?.vigente ?? null
  const precos = vigente ? precosDoTipo(vigente) : null
  const waUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(waContexto)}`

  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <a
          href={produto.voltarUrl}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--azuris-cyan)] transition-colors"
        >
          {produto.voltarLabel}
        </a>

        <h1 className="mt-6 text-3xl sm:text-4xl font-bold leading-tight">{h1}</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">{subtitulo}</p>

        {/* Compras corporativas / em grupo */}
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 size-5 shrink-0 text-[var(--accent-emerald)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">Compra para grupo ou empresa?</strong> Fale com a gente
              antes — os ingressos são poucos.
            </p>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          >
            Falar no WhatsApp
          </a>
        </div>

        {/* Resumo: lote vigente + o que inclui */}
        <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{resumoLabel}</div>
          {vigente && precos && (
            <>
              <div className="mt-1 text-3xl font-black">
                R$ {brl(precos.precoPixReais)}
                <span className="ml-2 text-base font-semibold text-[var(--text-muted)]">no PIX ou cartão 1x</span>
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">
                {vigente.nome}
                {escada?.restantes != null && (
                  <>
                    {' · '}
                    <strong className="text-[var(--text-primary)]">
                      {escada.restantes === 1 ? 'resta 1 ingresso' : `restam ${escada.restantes} ingressos`}
                    </strong>{' '}
                    neste lote
                  </>
                )}
              </div>
            </>
          )}
          <div className="mt-5 space-y-2 text-sm">
            {inclui.map((item) => (
              <div key={item} className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--azuris-cyan)]">●</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {vigente && precos ? (
          <InscricaoForm
            precoDeVendaReais={0}
            precoPixReais={precos.precoPixReais}
            precoCartaoBaseReais={precos.precoCartaoBaseReais}
            maxParcelas={precos.maxParcelas}
            // Só o vigente: os outros lotes aparecem na escada, mas não são escolhíveis.
            tipos={[
              {
                tipo_id: vigente.tipo_id,
                nome: vigente.nome,
                descricao: vigente.descricao,
                precoPixReais: precos.precoPixReais,
                precoCartaoBaseReais: precos.precoCartaoBaseReais,
                precoDeVendaReais: precos.precoDeVendaReais,
                maxParcelas: precos.maxParcelas,
              },
            ]}
            escada={escada?.degraus ?? []}
            endpoint={endpoint}
            gaItem={gaItem}
            enderecoObrigatorioPJ={produto.enderecoObrigatorioPJ}
          />
        ) : (
          <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6 text-center">
            <Clock className="mx-auto size-6 text-[var(--text-muted)]" />
            <p className="mt-3 font-bold">
              {escada?.esgotado ? 'Ingressos esgotados' : 'As vendas abrem em instantes'}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {escada?.esgotado
                ? 'Todos os lotes foram vendidos. Chama no WhatsApp que a gente avisa se abrir vaga.'
                : 'Não conseguimos carregar os lotes agora. Tenta de novo em alguns minutos ou fala com a gente.'}
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white"
            >
              Falar no WhatsApp
            </a>
          </div>
        )}

        <p className="mt-8 text-xs text-[var(--text-muted)] text-center">
          Pagamento processado pelo Asaas com segurança. Seus dados são usados apenas pra emissão da cobrança e contato
          sobre o evento.
        </p>
      </div>
    </main>
  )
}
