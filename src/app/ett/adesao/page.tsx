import type { Metadata } from 'next'
import Link from 'next/link'
import { getProduto } from '@/lib/produtos'
import { getPlanoEtt } from '@/lib/ett'
import InscricaoForm from '@/app/dssbr-2026/inscricao/InscricaoForm'
import EttShell, { ResumoEtt } from '../EttShell'

// Checkout da adesão do English Talk Time — R$67 cobrados UMA VEZ (não vira
// mensalidade). Preço vem do registry ([[produtos]] 'ett-adesao') e é recalculado
// no servidor no POST. A mensalidade é a outra página: /ett/assinatura.
const PRODUTO = getProduto('ett-adesao')

const INCLUI = [
  '2 encontros de 1 hora, individuais',
  'Material didático personalizado',
  'Entrada nos encontros de conversação',
  'Conta no ETT Player e sala do ETT Speak',
  'Os 30 primeiros dias de plataforma já inclusos',
]

export const metadata: Metadata = {
  title: 'Adesão — English Talk Time',
  description:
    'Adesão do English Talk Time: R$ 67 uma vez, com 2 horas de mentoria individual, material personalizado e os 30 primeiros dias de plataforma inclusos.',
  robots: { index: false, follow: false }, // checkout; a página indexável é englishtalktime.com.br
}

export const dynamic = 'force-dynamic'

export default function EttAdesaoPage() {
  const precoReais = PRODUTO.precoCentavos / 100

  return (
    <EttShell
      voltarUrl={PRODUTO.voltarUrl}
      voltarLabel={PRODUTO.voltarLabel}
      h1={
        <>
          Adesão · <span className="text-[var(--azuris-cyan)]">English Talk Time</span>
        </>
      }
      subtitulo={
        <>
          Pra quem já decidiu e quer começar com o plano montado.{' '}
          <strong className="text-[var(--text-primary)]">São duas horas de mentoria individual.</strong> Cobrado uma vez
          — não vira mensalidade.
        </>
      }
      rodape={
        <>
          A partir do dia 31, a continuidade é a{' '}
          <Link href="/ett/assinatura" className="font-semibold text-[var(--azuris-cyan)] hover:underline">
            Trilha de Dedicação (R$ {getPlanoEtt('mensal')!.valorCentavos / 100}/mês)
          </Link>
          .
        </>
      }
    >
      <ResumoEtt
        label="Adesão · pagamento único"
        preco={`R$ ${precoReais.toFixed(2).replace('.', ',')}`}
        unidade="uma vez"
        nota="No PIX ou cartão à vista. Em 2x ou 3x, os juros do cartão são por sua conta."
        inclui={INCLUI}
      />

      <InscricaoForm
        precoDeVendaReais={PRODUTO.precoDeVendaCentavos / 100}
        precoPixReais={precoReais}
        precoCartaoBaseReais={precoReais}
        maxParcelas={PRODUTO.maxParcelas}
        endpoint="/api/ett/adesao/inscricao"
        gaItem={{ id: PRODUTO.slug, name: PRODUTO.nome }}
        enderecoObrigatorioPJ={PRODUTO.enderecoObrigatorioPJ}
      />
    </EttShell>
  )
}
