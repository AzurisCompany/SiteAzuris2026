import type { Metadata } from 'next'
import Image from 'next/image'
import { getProduto } from '@/lib/produtos'
import { disponibilidadeDoTipo, listarTiposPublicos, precosDoTipo } from '@/lib/tipos-ingresso'
import { hojeBRT } from '@/lib/format'
import InscricaoForm, { type TipoOption } from '../inscricao/InscricaoForm'
import { dssMetadata } from '../metadata'

// Camiseta oficial do DSS 2026 — valor de CONGRESSISTA. Duplicata da de palestrante
// (/dssbr-2026/camiseta) com outro produto: R$70 na compra antecipada, que vai até o
// `vendas_ate` dos tipos (20/10, uma semana antes do evento). No dia, R$100 no
// credenciamento — e isso só se vende lá, nunca por aqui. Passado o prazo, os tipos
// saem da vitrine e a página troca o formulário pelo aviso do preço do dia.
const PRODUTO = getProduto('camiseta-congressista-dss-2026')

/** Preço no dia do evento, vendido no credenciamento (fora do site). Só texto. */
const PRECO_NO_DIA_REAIS = 100

const WA_PHONE = '5541998003687' // +55 (41) 99800-3687
const WA_URL = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(
  'Oi! Estava no checkout da camiseta oficial do DSS 2026 (congressista) e tenho uma dúvida.',
)}`

const DESTAQUES = [
  'Tecido dry fit premium — leve e respirável',
  '100% sublimação industrial',
  'Proteção UV 50+',
  'Retirada no credenciamento do congresso',
]

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`
/** '2026-10-20' → '20/10' */
const diaMes = (iso: string) => iso.slice(8, 10) + '/' + iso.slice(5, 7)

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/camiseta-congressista',
  title: 'Camiseta oficial DSSBR 2026 — compra antecipada',
  description: `Camiseta oficial do Data Science Summit Brasil 2026. Compra antecipada por R$ 70 (no dia do evento, R$ ${PRECO_NO_DIA_REAIS}). PIX ou cartão.`,
  image: 'https://azuris.com.br/dssbr-2026/camiseta-oficial.jpg',
})

export const dynamic = 'force-dynamic'

export default async function CamisetaCongressistaPage() {
  let tamanhos: TipoOption[] = []
  let vendasAte: string | null = null
  let bancoFora = false
  try {
    const hoje = hojeBRT()
    // Sem limite de quantidade nos tipos: a disponibilidade aqui é só ativo + prazo.
    const cadastrados = await listarTiposPublicos(PRODUTO.slug)
    // Nenhum tipo = migração ainda não rodou (ou tudo desligado no admin): isso é
    // "indisponível", não "encerrou" — o fim da pré-venda é só o prazo vencido.
    if (cadastrados.length === 0) bancoFora = true
    const abertos = cadastrados.filter((t) => disponibilidadeDoTipo(t, hoje, 0).disponivel)
    vendasAte = abertos.map((t) => t.vendas_ate).filter((d): d is string => !!d).sort()[0] ?? null
    tamanhos = abertos.map((t) => {
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
    // Banco fora: sem tamanho o servidor recusaria.
    bancoFora = true
  }
  const unitario = tamanhos[0]?.precoPixReais ?? PRODUTO.precoCentavos / 100
  const preVendaAberta = tamanhos.length > 0

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
          Garanta a sua <strong className="text-[var(--text-primary)]">antes do evento</strong> e pague menos. No dia do
          Data Science Summit Brasil 2026 ela custa {brl(PRECO_NO_DIA_REAIS)}.
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={preVendaAberta ? '' : 'opacity-50'}>
              <div className="text-xs uppercase tracking-widest text-[var(--azuris-cyan)]">
                Compra antecipada · por unidade
              </div>
              <div className="text-3xl font-black">{brl(unitario)}</div>
              <div className="text-xs text-[var(--text-muted)]">
                {preVendaAberta
                  ? `PIX ou cartão 1x${vendasAte ? ` · até ${diaMes(vendasAte)}` : ''}`
                  : 'encerrada'}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">No dia do evento</div>
              <div className="text-3xl font-black text-[var(--text-secondary)]">{brl(PRECO_NO_DIA_REAIS)}</div>
              <div className="text-xs text-[var(--text-muted)]">no credenciamento</div>
            </div>
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

        {preVendaAberta ? (
          <InscricaoForm
            precoDeVendaReais={0}
            precoPixReais={unitario}
            precoCartaoBaseReais={unitario}
            maxParcelas={PRODUTO.maxParcelas}
            tipos={tamanhos}
            rotuloTipo="Tamanho"
            quantidadeMax={PRODUTO.quantidadeMax}
            endpoint="/api/dss-camiseta-congressista/inscricao"
            gaItem={{ id: PRODUTO.slug, name: 'Camiseta oficial DSSBR 2026 (congressista, antecipada)' }}
            enderecoObrigatorioPJ={PRODUTO.enderecoObrigatorioPJ}
          />
        ) : bancoFora ? (
          <div className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 text-sm text-[var(--text-secondary)]">
            As vendas da camiseta estão momentaneamente indisponíveis.{' '}
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--azuris-cyan)]">
              Fale com a gente no WhatsApp
            </a>{' '}
            que a gente resolve.
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6 text-sm text-[var(--text-secondary)]">
            A compra antecipada encerrou. A camiseta continua à venda{' '}
            <strong className="text-[var(--text-primary)]">no credenciamento do congresso, por {brl(PRECO_NO_DIA_REAIS)}</strong>.
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
