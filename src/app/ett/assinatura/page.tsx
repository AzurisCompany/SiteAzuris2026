import type { Metadata } from 'next'
import Link from 'next/link'
import { PLANOS_ETT, getPlanoEtt } from '@/lib/ett'
import { getProduto } from '@/lib/produtos'
import EttShell, { ResumoEtt } from '../EttShell'
import AssinaturaEttForm from './AssinaturaEttForm'

// Checkout da Trilha de Dedicação do ETT — R$37/mês ou R$370/ano. É o único
// checkout público recorrente do site: nasce uma subscription no Asaas, não um
// pagamento avulso ([[ett]]). Vem DEPOIS da ativação acompanhada (/ett/ativacao, R$97);
// a alternativa sem mensalidade é /ett/aceleracao.
const MENSAL = getPlanoEtt('mensal')!
const ANUAL = getPlanoEtt('anual')!
const ATIVACAO = getProduto('ett-adesao')

const INCLUI = [
  'ETT Player completo — todas as ferramentas',
  'Plano de prática personalizado',
  'O sistema acompanha e registra sua evolução',
  'Acompanhamento e feedback das ferramentas',
]

export const metadata: Metadata = {
  title: 'Trilha de Dedicação — English Talk Time',
  description:
    'Assinatura da Trilha de Dedicação do English Talk Time: R$ 37/mês ou R$ 370/ano, depois da ativação acompanhada. ETT Player completo e plano de prática personalizado. Cancela quando quiser.',
  robots: { index: false, follow: false }, // checkout; a página indexável é englishtalktime.com.br
}

export const dynamic = 'force-dynamic'

export default function EttAssinaturaPage() {
  return (
    <EttShell
      exigeAtivacao
      h1={
        <>
          Trilha de <span className="text-[var(--azuris-cyan)]">Dedicação</span> · ETT
        </>
      }
      subtitulo={
        <>
          Sem rotina obrigatória — <strong className="text-[var(--text-primary)]">1h de dedicação por dia</strong>.
          Acesso às ferramentas no seu próprio ritmo.
        </>
      }
      rodape={
        <>
          Não quer pagar mensalidade?{' '}
          <Link href="/ett/aceleracao" className="font-semibold text-[var(--azuris-cyan)] hover:underline">
            Trilha de Aceleração: R$ 0
          </Link>{' '}
          pra quem topa manter a rotina. Ainda não fez a ativação?{' '}
          <Link href="/ett/ativacao" className="font-semibold text-[var(--azuris-cyan)] hover:underline">
            Comece por ela (R$ {ATIVACAO.precoCentavos / 100})
          </Link>
          .
        </>
      }
    >
      <ResumoEtt
        label="Trilha de Dedicação"
        preco={`R$ ${(MENSAL.valorCentavos / 100).toFixed(2).replace('.', ',')}`}
        unidade={MENSAL.unidade}
        nota={`Anual por R$ ${ANUAL.valorCentavos / 100} — dois meses de desconto. Cancela quando quiser, direto no checkout.`}
        inclui={INCLUI}
      />

      <AssinaturaEttForm planos={PLANOS_ETT} />
    </EttShell>
  )
}
