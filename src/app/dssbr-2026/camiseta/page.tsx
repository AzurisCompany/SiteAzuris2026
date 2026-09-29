import type { Metadata } from 'next'
import Image from 'next/image'
import { getProduto } from '@/lib/produtos'
import { listarTiposPublicos, precosDoTipo } from '@/lib/tipos-ingresso'
import InscricaoForm, { type TipoOption } from '../inscricao/InscricaoForm'
import { dssMetadata } from '../metadata'

// Camiseta oficial do DSS 2026 — valor de PALESTRANTE. Vendida só por link direto
// (noindex, fora da landing). Cada tamanho é um tipo em /admin/ingressos (o preço vive
// lá); o servidor exige o tamanho e cobra preço × quantidade ([[checkout-produto]]).
const PRODUTO = getProduto('camiseta-dss-2026')

const WA_PHONE = '5541998003687' // +55 (41) 99800-3687
const WA_URL = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(
  'Oi! Estava no checkout da camiseta oficial do DSS 2026 e tenho uma dúvida.',
)}`

const DESTAQUES = [
  'Tecido dry fit premium — leve e respirável',
  '100% sublimação industrial',
  'Proteção UV 50+',
  'Retirada no credenciamento do congresso',
]

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/camiseta',
  title: 'Camiseta oficial DSSBR 2026 — palestrantes',
  description: 'Camiseta oficial do Data Science Summit Brasil 2026, valor exclusivo para palestrantes. PIX ou cartão.',
  image: 'https://azuris.com.br/dssbr-2026/camiseta-oficial.jpg',
  noindex: true, // link direto para palestrantes
})

export const dynamic = 'force-dynamic'

export default async function CamisetaPage() {
  let tamanhos: TipoOption[] = []
  try {
    tamanhos = (await listarTiposPublicos(PRODUTO.slug)).map((t) => {
      const p = precosDoTipo(t)
      return {
        tipo_id: t.tipo_id,
        nome: t.nome,
        descricao: t.descricao,
        precoPixReais: p.precoPixReais,
        precoCartaoBaseReais: p.precoCartaoBaseReais,
        precoDeVendaReais: p.precoDeVendaReais,
        maxParcelas: p.maxParcelas,
      }
    })
  } catch {
    // Banco fora ou migração não rodada: sem tamanho o servidor recusaria — a página
    // avisa e manda pro WhatsApp em vez de um formulário que não fecha.
    tamanhos = []
  }
  const unitario = tamanhos[0]?.precoPixReais ?? PRODUTO.precoCentavos / 100

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
          Camiseta oficial <span className="text-[var(--azuris-cyan)]">DSSBR 2026</span>
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Valor exclusivo para palestrantes</strong> do Data Science
          Summit Brasil 2026.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--azuris-surface)]">
          <Image
            src="/dssbr-2026/camiseta-oficial.jpg"
            alt="Camiseta oficial DSSBR 2026: camiseta esportiva azul com estampa de circuitos e logo do Data Science Summit 2026, frente e costas"
            width={1531}
            height={1027}
            priority
            className="h-auto w-full"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Palestrantes · por unidade</div>
          <div className="text-3xl font-black">
            R$ {unitario.toFixed(2).replace('.', ',')}
            <span className="ml-2 text-base font-semibold text-[var(--text-muted)]">no PIX ou cartão 1x</span>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            {DESTAQUES.map((item) => (
              <div key={item} className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--azuris-cyan)]">●</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {tamanhos.length > 0 ? (
          <InscricaoForm
            precoDeVendaReais={0}
            precoPixReais={unitario}
            precoCartaoBaseReais={unitario}
            maxParcelas={PRODUTO.maxParcelas}
            tipos={tamanhos}
            rotuloTipo="Tamanho"
            quantidadeMax={PRODUTO.quantidadeMax}
            endpoint="/api/dss-camiseta/inscricao"
            gaItem={{ id: PRODUTO.slug, name: 'Camiseta oficial DSSBR 2026 (palestrante)' }}
            enderecoObrigatorioPJ={PRODUTO.enderecoObrigatorioPJ}
          />
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 text-sm text-[var(--text-secondary)]">
            As vendas da camiseta estão momentaneamente indisponíveis.{' '}
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--azuris-cyan)]">
              Fale com a gente no WhatsApp
            </a>{' '}
            que a gente resolve.
          </div>
        )}

        <p className="mt-8 text-xs text-[var(--text-muted)] text-center">
          Pagamento processado pelo Asaas com segurança. Seus dados são usados apenas pra emissão da cobrança e pra
          combinar a retirada da camiseta.
        </p>
      </div>
    </main>
  )
}
