import type { Metadata } from 'next'
import { getProduto } from '@/lib/produtos'
import { contarInscritosPorTipo, listarTipos, precosDoTipo } from '@/lib/tipos-ingresso'
import { escadaPorQuantidade, type EscadaQuantidade } from '@/lib/lotes-quantidade'
import { hojeBRT } from '@/lib/format'
import InscricaoForm from '../../dssbr-2026/inscricao/InscricaoForm'
import { dssMetadata } from '../../dssbr-2026/metadata'

// PRE-LOAD do DSS 2027 — FullPass R$550, 50 ingressos. Vendido antes de existir data,
// local ou grade do 2027: a página não promete nenhum dos três. Os 50 são o `limite_qtd`
// do tipo `fullpass-preload` (pagos + pendentes, como o VIP/Business): esgotou, a página
// troca o formulário pelo aviso. Lote novo depois = outro tipo com `ordem` maior — a
// escada por quantidade passa a vendê-lo sozinha.
//
// Primeiro checkout com o PIX na nossa tela (`pixNaTela` no registry): QR + copia-e-cola
// da cobrança aqui, sem passar pela fatura do Asaas.
const PRODUTO = getProduto('dss-2027-preload')
const TOTAL_PRELOAD = 50

const WA_PHONE = '5541998003687' // +55 (41) 99800-3687
const WA_URL = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(
  'Oi! Vi o FullPass Pre-Load do DSS 2027 e tenho uma dúvida.',
)}`

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2027/preload',
  title: 'DSS 2027 — FullPass Pre-Load · Data Science Summit Brasil',
  description: `Garanta o FullPass do Data Science Summit Brasil 2027 antes de todo mundo: ${TOTAL_PRELOAD} ingressos por R$ 550, no PIX ou no cartão.`,
})

export const dynamic = 'force-dynamic'

export default async function PreloadDss2027Page() {
  let escada: EscadaQuantidade | null = null
  try {
    escada = escadaPorQuantidade(
      await listarTipos(PRODUTO.slug),
      await contarInscritosPorTipo(PRODUTO.slug),
      hojeBRT(),
    )
  } catch {
    escada = null // banco fora: sem tipo o servidor recusaria
  }
  const vigente = escada?.vigente ?? null
  const precos = vigente ? precosDoTipo(vigente) : null
  const preco = precos?.precoPixReais ?? PRODUTO.precoCentavos / 100

  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <a
          href={PRODUTO.voltarUrl}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--azuris-cyan)] transition-colors"
        >
          {PRODUTO.voltarLabel}
        </a>

        <h1 className="mt-6 text-3xl sm:text-4xl font-bold leading-tight">
          DSS <span className="text-[var(--azuris-cyan)]">2027</span> — FullPass Pre-Load
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          O FullPass do Data Science Summit Brasil 2027 — todos os dias do evento — antes de abrir qualquer lote.
          São só {TOTAL_PRELOAD} ingressos. Data, local e grade ainda serão anunciados.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--azuris-cyan)]">FullPass · todos os dias</div>
              <div className="text-4xl font-black">{brl(preco)}</div>
              <div className="text-xs text-[var(--text-muted)]">
                PIX ou cartão 1x · até {precos?.maxParcelas ?? PRODUTO.maxParcelas}x com juros
              </div>
            </div>
            {escada?.restantes != null && (
              <div className="text-right">
                <div className="text-3xl font-black text-[var(--azuris-cyan)]">{escada.restantes}</div>
                <div className="text-xs text-[var(--text-muted)]">de {TOTAL_PRELOAD} ingressos restantes</div>
              </div>
            )}
          </div>
        </div>

        {vigente && precos ? (
          <InscricaoForm
            precoDeVendaReais={0}
            precoPixReais={precos.precoPixReais}
            precoCartaoBaseReais={precos.precoCartaoBaseReais}
            maxParcelas={precos.maxParcelas}
            endpoint="/api/dss-2027-preload/inscricao"
            pixStatusEndpoint="/api/dss-2027-preload/status"
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
            gaItem={{ id: PRODUTO.slug, name: PRODUTO.nome }}
            enderecoObrigatorioPJ={PRODUTO.enderecoObrigatorioPJ}
          />
        ) : escada?.esgotado ? (
          <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6 text-sm text-[var(--text-secondary)]">
            Os {TOTAL_PRELOAD} ingressos do Pre-Load esgotaram.{' '}
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--azuris-cyan)]">
              Fale com a gente no WhatsApp
            </a>{' '}
            pra entrar na lista do próximo lote.
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 text-sm text-[var(--text-secondary)]">
            As vendas estão momentaneamente indisponíveis.{' '}
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--azuris-cyan)]">
              Fale com a gente no WhatsApp
            </a>{' '}
            que a gente resolve.
          </div>
        )}

        <p className="mt-8 text-xs text-[var(--text-muted)] text-center">
          Pagamento processado pelo Asaas com segurança. Seus dados são usados apenas pra emissão da cobrança e pra
          comunicação sobre o DSS 2027.
        </p>
      </div>
    </main>
  )
}
