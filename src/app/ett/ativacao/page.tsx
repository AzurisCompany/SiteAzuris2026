import type { Metadata } from 'next'
import Link from 'next/link'
import { getProduto } from '@/lib/produtos'
import { getPlanoEtt } from '@/lib/ett'
import InscricaoForm from '@/app/dssbr-2026/inscricao/InscricaoForm'
import EttShell, { ResumoEtt } from '../EttShell'

// Checkout da ATIVAÇÃO ACOMPANHADA do English Talk Time — R$97 cobrados UMA VEZ, é o
// 1º mês (não vira mensalidade). Até 09/11/2026 era a "adesão" de R$67 em /ett/adesao,
// que agora redireciona pra cá (next.config). Preço vem do registry ([[produtos]]
// 'ett-adesao', slug mantido pelo histórico) e é recalculado no servidor no POST.
// Depois dela, no dia 31: /ett/assinatura (Dedicação) ou /ett/aceleracao (R$0).
const PRODUTO = getProduto('ett-adesao')

const INCLUI = [
  'Todas as ferramentas do ETT Player por 30 dias',
  '2 sessões individuais de 1 hora de orientação',
  'Diagnóstico de nível e vocabulário (Level Check) e plano de prática montados com você',
  'Material de prática personalizado',
  'Vídeos de demonstração das ferramentas',
  'Conta no ETT Player e sala do ETT Speak',
  'Acompanhamento e feedback das ferramentas',
]

export const metadata: Metadata = {
  title: 'Ativação acompanhada — English Talk Time',
  description:
    'Ativação acompanhada do English Talk Time: R$ 97 uma vez, é o seu 1º mês — 30 dias com todas as ferramentas e 2 sessões individuais de orientação.',
  robots: { index: false, follow: false }, // checkout; a página indexável é englishtalktime.com.br
}

export const dynamic = 'force-dynamic'

export default function EttAtivacaoPage() {
  const precoReais = PRODUTO.precoCentavos / 100

  return (
    <EttShell
      isencao
      voltarUrl={PRODUTO.voltarUrl}
      voltarLabel={PRODUTO.voltarLabel}
      h1={
        <>
          Ativação acompanhada · <span className="text-[var(--azuris-cyan)]">English Talk Time</span>
        </>
      }
      subtitulo={
        <>
          Sua entrada na plataforma: 30 dias com todas as ferramentas e orientação individual pra conhecer tudo,
          organizar a rotina de prática e configurar atividades pros seus objetivos.{' '}
          <strong className="text-[var(--text-primary)]">Cobrado uma vez — não vira mensalidade.</strong>
        </>
      }
      rodape={
        <>
          No dia 31 você escolhe uma trilha:{' '}
          <Link href="/ett/assinatura" className="font-semibold text-[var(--azuris-cyan)] hover:underline">
            Dedicação (R$ {getPlanoEtt('mensal')!.valorCentavos / 100}/mês)
          </Link>{' '}
          ou{' '}
          <Link href="/ett/aceleracao" className="font-semibold text-[var(--azuris-cyan)] hover:underline">
            Aceleração (R$ 0 com a meta de 1h por dia)
          </Link>
          . Os encontros continuam abertos a todos.
        </>
      }
    >
      <ResumoEtt
        label="Ativação acompanhada · seu 1º mês"
        preco={`R$ ${precoReais.toFixed(2).replace('.', ',')}`}
        unidade="pagamento único"
        nota="Orientação de uso da plataforma, não aula particular. No PIX ou cartão à vista; em 2x ou 3x, os juros do cartão são por sua conta."
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
