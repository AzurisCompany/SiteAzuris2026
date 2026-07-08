import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowRight, MapPin, CalendarDays, Check, Users } from 'lucide-react'
import { getProduto } from '@/lib/produtos'

const PRODUTO = getProduto('dss-2026')
const DSS = 'https://dssbr.com.br'
const CHECKOUT = '/dssbr-2026/inscricao?utm_source=azuris&utm_medium=landing&utm_campaign=dssbr-2026'

const WA_PHONE = '5541998003687' // +55 (41) 99800-3687
const WA_CORP = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(
  'Oi! Vim pela página do DSSBR 2026 e quero saber sobre os pacotes especiais para grupos / compras corporativas.',
)}`

const precoBase = PRODUTO.precoCentavos / 100
const precoDeVenda = PRODUTO.precoDeVendaCentavos / 100
const precoPix = Number((precoBase * (1 - PRODUTO.pixDescontoPct)).toFixed(2))
const precoCartao = Number((precoBase * (1 + PRODUTO.cartaoAcrescimoPct)).toFixed(2))
const descontoPct = Math.round((1 - precoPix / precoDeVenda) * 100)
const brl = (v: number) => v.toFixed(2).replace('.', ',')

export const metadata: Metadata = {
  title: 'DSSBR 2026 — Data Science Summit Brasil | 27, 28 e 29 de outubro, Curitiba',
  description:
    'A 5ª edição do Data Science Summit Brasil. 3 dias com as big techs e os times que colocam IA em produção nas maiores empresas do país. 27 a 29 de outubro, IEP Curitiba. Pré-venda a partir de R$ 470.',
  openGraph: {
    title: 'DSSBR 2026 — Data Science Summit Brasil',
    description:
      'For & by the AI industry. 3 dias com cases reais de IA em produção. 27 a 29/out · Curitiba.',
    images: [`${DSS}/assets/photos/dss2025-012.jpg`],
    type: 'website',
  },
}

const STATS = [
  { n: '658', label: 'participantes' },
  { n: '120', label: 'palestras' },
  { n: '98', label: 'palestrantes' },
  { n: '14', label: 'workshops' },
  { n: '9', label: 'mesas-redondas' },
]

const SPEAKERS = [
  { nome: 'Luciano N. Dolenc', cargo: 'Diretor Geral · DSSBR', img: 'speaker-luciano-dolenc.jpeg' },
  { nome: 'Fabio A. Guerra', cargo: 'Ph.D IA & ML · Diretor de Tecnologia', img: 'speaker-fabio-guerra.jpg' },
  { nome: 'Emmanuel Marques', cargo: 'CSO · GAIO Data OS', img: 'speaker-emmanuel-marques.jpg' },
  { nome: 'Daniel B. Dias', cargo: 'Sr Software Engineer · dbt Labs', img: 'speaker-daniel-dias.jpg' },
  { nome: 'André Ruschel', cargo: 'Regional Director MVP · Microsoft', img: 'speaker-andre-ruschel.jpg' },
  { nome: 'Bruno Ghizoni', cargo: 'Co-Founder · Multicortex', img: 'speaker-bruno-ghizoni.jpg' },
  { nome: 'Gabriel Vernalha Ribeiro', cargo: 'CDAO · DAMA Brasil', img: 'speaker-gabriel-vernalha.jpg' },
  { nome: 'Vladimir Morozowski', cargo: 'AI · Startup Mentor & Advisor', img: 'speaker-vladimir-morozowski.jpeg' },
  { nome: 'Lucas Moraes', cargo: 'Chief Innovation Officer · Bindflow', img: 'speaker-lucas-moraes.jpg' },
  { nome: 'Jeferson Passos', cargo: 'COO · Bindflow', img: 'speaker-jeferson-passos.jpg' },
  { nome: 'Alessandro Faria', cargo: 'Founder · Inventor · Intel Innovator', img: 'speaker-alessandro-faria.png' },
  { nome: 'Marcus Garcia', cargo: 'Pesquisador IA · Learning Analytics', img: 'speaker-marcus-garcia.jpg' },
  { nome: 'Klaubert Herr', cargo: 'Tech Sales · Security Systems', img: 'speaker-klaubert-herr.png' },
]

const PROGRAMACAO = [
  {
    dia: 'Dia 01 · Terça (27)',
    titulo: 'Workshops Hands-on',
    itens: [
      'Plataforma de IA na AWS — Bedrock + SageMaker (4h)',
      'RAG com Snowflake Cortex — LLM no data warehouse (4h)',
      'Real-time com ClickHouse — analytics sub-segundo (4h)',
    ],
  },
  {
    dia: 'Dia 02 · Quarta (28)',
    titulo: 'Keynotes & Tracks',
    itens: [
      'Keynote: IA no Brasil — painel C-level (60min)',
      'Track Cases de Produção — 8 talks de empresas BR',
      'Track Estratégia & ROI — 6 talks com CDOs e CTOs',
    ],
  },
  {
    dia: 'Dia 03 · Quinta (29)',
    titulo: 'Avançado & Negócios',
    itens: [
      'Sessões técnicas avançadas — 3 tracks paralelos',
      'Rodada de Negócios — match curado (90min)',
      'Jantar dos palestrantes — encerramento exclusivo',
    ],
  },
]

const LOGOS = [
  'logo-AWS.png', 'logo-Oracle.png', 'logo-snowflake-1.png', 'logo-clickhouse.png',
  'logo-Magalu-Cloud.png', 'logo-Cloudera.png', 'logo-microsoft-1.png', 'logo-nvidia.png',
  'logo-databricks.png', 'logo-dbt.png', 'logo-ibm6.png', 'logo-Boticario-2.jpg',
  'logo-creditas.png', 'logo-eleflow.png', 'logo-objective-1.png', 'logo-bindflow.png',
  'logo-gaio.png', 'logo-kxc.png', 'logo-IEP-1.png', 'logo-azuris-1.png',
]

const PHOTOS = ['dss2025-000.jpg', 'dss2025-012.jpg', 'dss2025-008.jpg', 'dss2025-015.jpg', 'dss2025-018.jpg', 'dss2025-005.jpg']

function CtaButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <a
      href={CHECKOUT}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--azuris-cyan)] to-[var(--accent-violet)] px-7 py-4 text-base font-bold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 ${className}`}
    >
      {children}
      <ArrowRight className="size-5" />
    </a>
  )
}

export default function DssbrLandingPage() {
  return (
    <main className="min-h-screen bg-ink text-foam">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={`${DSS}/assets/photos/dss2025-012.jpg`}
            alt="Data Science Summit Brasil"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/90 to-ink" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${DSS}/assets/logo-dss-2026.svg`} alt="DSSBR 2026" className="h-12 sm:h-14 w-auto" />

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-foam/70">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate/60 bg-deep/60 px-3 py-1">
              <CalendarDays className="size-4 text-cyan-brand" /> 27, 28 e 29 de outubro · 2026
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate/60 bg-deep/60 px-3 py-1">
              <MapPin className="size-4 text-cyan-brand" /> IEP — Curitiba/PR
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-brand/40 bg-cyan-brand/10 px-3 py-1 text-cyan-brand font-semibold">
              5ª edição · desde 2018
            </span>
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl sm:text-6xl font-bold leading-[1.05] tracking-tight">
            O congresso de <span className="text-brand-gradient">IA &amp; Big Data</span> de quem coloca dados em produção.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-foam/70 leading-relaxed">
            Três dias com as big techs e os times que estão rodando cases reais de IA nas maiores
            empresas do Brasil. Não é teoria de PDF — é economia, conversão, NPS, fraude e latência com número pra mostrar.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <CtaButton>Garantir minha vaga — R$ {precoPix.toFixed(0)} no PIX</CtaButton>
            <a href="#programacao" className="text-sm font-semibold text-foam/70 hover:text-cyan-brand transition-colors">
              ver a programação ↓
            </a>
          </div>
          <p className="mt-3 text-sm text-foam/50">
            Pré-venda · de <span className="line-through">R$ {brl(precoDeVenda)}</span> por R$ {brl(precoPix)} no PIX · cartão em até {PRODUTO.maxParcelas}x (1x à vista, 2x-{PRODUTO.maxParcelas}x com juros).
          </p>

          {/* GRUPOS & CORPORATIVO */}
          <div className="mt-8 flex max-w-2xl flex-col gap-3 rounded-xl border border-emerald-accent/30 bg-emerald-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 size-5 shrink-0 text-emerald-accent" />
              <p className="text-sm text-foam/70">
                <strong className="text-foam">Compra para grupo ou empresa?</strong>{' '}
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
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate/60 bg-deep/40">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-xs uppercase tracking-[0.18em] text-foam/40 mb-6">A edição 2025 em números</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-black text-cyan-brand">{s.n}</div>
                <div className="mt-1 text-sm text-foam/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative mx-auto max-w-4xl px-6">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">For &amp; by the AI industry</div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            O ponto de encontro de quem trabalha com dados em escala — desde 2018.
          </h2>
          <p className="mt-5 text-lg text-foam/70 leading-relaxed">
            O Data Science Summit Brasil é, há cinco edições, onde a comunidade brasileira de dados se reúne.
            Em 2026 o palco é de quem colocou IA em produção e tem o resultado pra provar. Workshops hands-on,
            cases de produção, estratégia &amp; ROI, rodada de negócios e muito networking — três dias inteiros
            em Curitiba.
          </p>
        </div>
      </section>

      {/* PROGRAMACAO */}
      <section id="programacao" className="py-20 bg-deep/40 border-y border-slate/60">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Programação</h2>
          <p className="mt-3 text-foam/60">Três dias, do hands-on ao C-level.</p>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {PROGRAMACAO.map((bloco) => (
              <div key={bloco.dia} className="rounded-2xl border border-slate/60 bg-gradient-to-br from-deep to-ink p-6">
                <div className="text-xs uppercase tracking-widest text-cyan-brand">{bloco.dia}</div>
                <h3 className="mt-2 text-xl font-bold">{bloco.titulo}</h3>
                <ul className="mt-4 space-y-3 text-sm text-foam/70">
                  {bloco.itens.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="size-4 shrink-0 text-cyan-brand mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPEAKERS */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Quem sobe no palco</h2>
          <p className="mt-3 text-foam/60">Alguns dos nomes confirmados. A grade completa cresce toda semana.</p>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {SPEAKERS.map((sp) => (
              <div key={sp.nome} className="group rounded-2xl border border-slate/60 bg-deep/40 overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={`${DSS}/assets/speakers/${sp.img}`}
                    alt={sp.nome}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="font-semibold leading-tight">{sp.nome}</div>
                  <div className="mt-1 text-xs text-foam/55">{sp.cargo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERIA */}
      <section className="py-20 bg-deep/40 border-y border-slate/60">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">A edição anterior</h2>
          <p className="mt-3 text-foam/60">Curitiba, 2025.</p>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4">
            {PHOTOS.map((ph) => (
              <div key={ph} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate/60">
                <Image
                  src={`${DSS}/assets/photos/${ph}`}
                  alt="DSS 2025"
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARCEIROS */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs uppercase tracking-[0.18em] text-foam/40 mb-8 text-center">
            Patrocinadores &amp; parceiros
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-8 gap-y-10 items-center">
            {LOGOS.map((logo) => (
              <div key={logo} className="relative h-10 opacity-70 hover:opacity-100 transition-opacity">
                <Image
                  src={`${DSS}/assets/logos/${logo}`}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL / PREÇO */}
      <section className="py-20 bg-deep/40 border-t border-slate/60">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Garanta sua vaga na <span className="text-brand-gradient">pré-venda</span>.
          </h2>
          <p className="mt-4 text-foam/70">
            Lote 1 com o melhor preço. FullPass dos 3 dias de evento.
          </p>

          <div className="mt-8 rounded-2xl border border-slate/60 bg-gradient-to-br from-deep to-ink p-8">
            <div className="text-xs uppercase tracking-widest text-foam/40">Pré-venda · Lote 1 · FullPass 3 dias</div>
            <div className="mt-2 text-sm text-foam/40 line-through">R$ {brl(precoDeVenda)} no lote final</div>
            <div className="mt-1 text-5xl font-black">
              R$ {brl(precoPix)} <span className="text-xl font-semibold text-foam/50">no PIX</span>
            </div>
            <div className="mt-2 text-sm text-foam/60">
              {descontoPct}% mais barato que o lote final · ou cartão R$ {brl(precoCartao)} em até {PRODUTO.maxParcelas}x (1x à vista, 2x-{PRODUTO.maxParcelas}x com juros)
            </div>
            <ul className="mt-6 space-y-2 text-sm text-foam/70 text-left max-w-sm mx-auto">
              <li className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-accent mt-0.5" /> Acesso aos 3 dias de evento</li>
              <li className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-accent mt-0.5" /> Workshops hands-on, keynotes e tracks</li>
              <li className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-accent mt-0.5" /> Rodada de negócios e networking</li>
              <li className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-accent mt-0.5" /> Reembolso até 45 dias antes do evento</li>
            </ul>
            <CtaButton className="mt-8 w-full sm:w-auto">Garantir minha vaga</CtaButton>
            <p className="mt-3 text-xs text-foam/45">Checkout seguro via Asaas · PIX ou cartão · inscrição individual.</p>
          </div>

          <p className="mt-10 text-sm text-foam/50">
            Dúvidas? <a href="mailto:contato@dssbr.com.br" className="underline hover:text-cyan-brand">contato@dssbr.com.br</a>
            {' '}· WhatsApp (41) 99800-3687 · uma realização <a href="/" className="underline hover:text-cyan-brand">Azuris</a>.
          </p>
        </div>
      </section>
    </main>
  )
}
