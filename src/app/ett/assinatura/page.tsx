import type { Metadata } from 'next'
import Link from 'next/link'
import { PLANOS_ETT, getPlanoEtt } from '@/lib/ett'
import { getProduto } from '@/lib/produtos'
import EttShell, { ResumoEtt } from '../EttShell'
import AssinaturaEttForm from './AssinaturaEttForm'

// Checkout da Trilha de Dedicação do ETT — R$37/mês ou R$370/ano. É o único
// checkout público recorrente do site: nasce uma subscription no Asaas, não um
// pagamento avulso ([[ett]]). A adesão é a outra página: /ett/adesao.
const MENSAL = getPlanoEtt('mensal')!
const ANUAL = getPlanoEtt('anual')!
const ADESAO = getProduto('ett-adesao')

const INCLUI = [
  'ETT Player completo — as 10 ferramentas',
  'Encontros online e presenciais',
  'O sistema acompanha e registra sua evolução',
  'Acompanhamento e feedback das ferramentas',
]

export const metadata: Metadata = {
  title: 'Trilha de Dedicação — English Talk Time',
  description:
    'Assinatura da Trilha de Dedicação do English Talk Time: R$ 37/mês ou R$ 370/ano. ETT Player completo, encontros online e presenciais. Cancela quando quiser.',
  robots: { index: false, follow: false }, // checkout; a página indexável é englishtalktime.com.br
}

export const dynamic = 'force-dynamic'

export default function EttAssinaturaPage() {
  return (
    <EttShell
      h1={
        <>
          Trilha de <span className="text-[var(--azuris-cyan)]">Dedicação</span> · ETT
        </>
      }
      subtitulo={
        <>
          Pra quem quer tudo no próprio ritmo, sem rotina obrigatória —{' '}
          <strong className="text-[var(--text-primary)]">1h de dedicação por dia</strong>. Vale a partir do dia 31.
        </>
      }
      rodape={
        <>
          Ainda não fez a adesão?{' '}
          <Link href="/ett/adesao" className="font-semibold text-[var(--azuris-cyan)] hover:underline">
            Comece pela adesão de R$ {ADESAO.precoCentavos / 100}
          </Link>{' '}
          — os 30 primeiros dias de plataforma já vêm inclusos.
        </>
      }
    >
      <ResumoEtt
        label="Trilha de Dedicação"
        preco={`R$ ${(MENSAL.valorCentavos / 100).toFixed(2).replace('.', ',')}`}
        unidade={MENSAL.unidade}
        nota={`No anual saem R$ ${ANUAL.valorCentavos / 100} — dois meses de desconto. Cancela quando quiser, direto no checkout.`}
        inclui={INCLUI}
      />

      <AssinaturaEttForm planos={PLANOS_ETT} />
    </EttShell>
  )
}
