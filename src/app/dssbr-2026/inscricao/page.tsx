import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { getProduto } from '@/lib/produtos'
import { listarTiposAtivos, precosDoTipo } from '@/lib/tipos-ingresso'
import InscricaoForm, { type TipoOption } from './InscricaoForm'
import { dssMetadata } from '../metadata'

const PRODUTO = getProduto('dss-2026')

const WA_PHONE = '5541998003687' // +55 (41) 99800-3687
const WA_CORP = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(
  'Oi! Estava no checkout do DSSBR 2026 e quero saber sobre os pacotes para grupos / compras corporativas.',
)}`

export const metadata: Metadata = dssMetadata({
  path: '/dssbr-2026/inscricao',
  title: 'Inscrição — DSS 2026 · Data Science Summit Brasil',
  description:
    'Garanta sua vaga no DSS 2026 (27–29/out, Curitiba). PIX à vista ou cartão em até 3x (1x à vista, 2x-3x com juros).',
  noindex: true, // página de checkout, sem indexação — mas com card do congresso no WhatsApp
})

export const dynamic = 'force-dynamic'

export default async function InscricaoPage() {
  const precoBaseReais = PRODUTO.precoCentavos / 100
  const precoDeVendaReais = PRODUTO.precoDeVendaCentavos / 100
  const precoPixReais = Number((precoBaseReais * (1 - PRODUTO.pixDescontoPct)).toFixed(2))
  const precoCartaoBaseReais = Number((precoBaseReais * (1 + PRODUTO.cartaoAcrescimoPct)).toFixed(2))

  // Tipos de ingresso cadastrados no admin (se houver, o checkout mostra o seletor).
  let tipoOptions: TipoOption[] = []
  try {
    const tipos = await listarTiposAtivos(PRODUTO.slug)
    tipoOptions = tipos.map((t) => {
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
    // Banco sem a tabela (migration não rodou) → cai no preço único, sem quebrar o checkout.
    tipoOptions = []
  }
  const temTipos = tipoOptions.length > 0

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
          Sua inscrição no <span className="text-[var(--azuris-cyan)]">Data Science Summit Brasil 2026</span>
        </h1>

        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Esta página é para <strong className="text-[var(--text-primary)]">inscrição individual</strong>.
        </p>

        {/* Compras corporativas / em grupo */}
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 size-5 shrink-0 text-[var(--accent-emerald)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">Compra para grupo ou empresa?</strong>{' '}
              Temos pacotes com desconto por volume e benefícios extras — fale com a gente.
            </p>
          </div>
          <a
            href={WA_CORP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          >
            Falar no WhatsApp
          </a>
        </div>

        {/* Resumo do ingresso — só no modo preço único. Com tipos cadastrados, o seletor do form mostra os preços. */}
        {!temTipos && (
        <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
                Pré-venda · Lote 1
              </div>
              <div className="mt-1 text-sm text-[var(--text-muted)] line-through">
                R$ {precoDeVendaReais.toFixed(2).replace('.', ',')} no lote final
              </div>
              <div className="text-3xl font-black">
                R$ {precoPixReais.toFixed(2).replace('.', ',')}
                <span className="ml-2 text-base font-semibold text-[var(--text-muted)]">no PIX</span>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-[var(--accent-emerald)]/15 px-3 py-1 text-xs font-semibold text-[var(--accent-emerald)]">
              {PRODUTO.descricao}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              3 dias de evento · 120 palestras · 98 palestrantes · 14 workshops · 9 mesas-redondas
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              Networking, rodadas de negócio, pitches de startups e festa de encerramento
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-[var(--azuris-cyan)]">●</span>
              PIX à vista: <strong className="text-[var(--text-primary)]">R$ {precoPixReais.toFixed(2).replace('.', ',')}</strong>
              {' '}· Cartão: R$ {precoCartaoBaseReais.toFixed(2).replace('.', ',')} em até {PRODUTO.maxParcelas}x (1x à vista, 2x-{PRODUTO.maxParcelas}x com juros)
            </div>
          </div>
        </div>
        )}

        {temTipos && (
          <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
            <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Pré-venda · {PRODUTO.descricao}</div>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--azuris-cyan)]">●</span>
                3 dias de evento · 120 palestras · 98 palestrantes · 14 workshops · 9 mesas-redondas
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--azuris-cyan)]">●</span>
                Networking, rodadas de negócio, pitches de startups e festa de encerramento
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--accent-emerald)]">●</span>
                Escolha seu tipo de ingresso abaixo.
              </div>
            </div>
          </div>
        )}

        <InscricaoForm
          precoDeVendaReais={precoDeVendaReais}
          precoPixReais={precoPixReais}
          precoCartaoBaseReais={precoCartaoBaseReais}
          maxParcelas={PRODUTO.maxParcelas}
          tipos={tipoOptions}
        />

        <p className="mt-8 text-xs text-[var(--text-muted)] text-center">
          Pagamento processado pelo Asaas com segurança. Seus dados são usados apenas pra emissão da cobrança e contato sobre o evento.
        </p>
      </div>
    </main>
  )
}
