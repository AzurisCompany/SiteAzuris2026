import type { Metadata } from 'next'
import Link from 'next/link'
import { getProduto } from '@/lib/produtos'
import { getPlanoEtt } from '@/lib/ett'
import { hojeBRT } from '@/lib/format'
import { listarTiposPublicos, contarInscritosPorTipo, disponibilidadeDoTipo } from '@/lib/tipos-ingresso'
import EttShell, { ResumoEtt, WA_ETT } from '../EttShell'
import AceleracaoForm from './AceleracaoForm'

// Trilha de Aceleração do ETT — R$0, "custa 1h da sua dedicação por dia". Não cobra
// nada: o tipo 'aceleracao' é gratuito e cai no fluxo sem CPF/Asaas de
// [[checkout-produto]]. Vem depois da ativação acompanhada (/ett/ativacao); a
// alternativa paga é a Dedicação (/ett/assinatura).
const PRODUTO = getProduto('ett-aceleracao')
const TIPO_ID = 'aceleracao'
const MENSAL = getPlanoEtt('mensal')!

const INCLUI = [
  'ETT Player completo — todas as ferramentas',
  'Presença nos encontros conta pra meta',
  'O sistema acompanha e registra sua evolução',
  'Acompanhamento e feedback das ferramentas',
  'Um prêmio a cada mês de meta batida',
]

export const metadata: Metadata = {
  title: 'Trilha de Aceleração — English Talk Time',
  description:
    'Trilha de Aceleração do English Talk Time: R$ 0 com a meta de 1h de dedicação por dia. ETT Player completo, sem mensalidade, depois da ativação acompanhada.',
  robots: { index: false, follow: false }, // checkout; a página indexável é englishtalktime.com.br
}

export const dynamic = 'force-dynamic'

export default async function EttAceleracaoPage() {
  // Tolerante a banco sem o tipo: sem 'aceleracao' ativo, a página manda pro WhatsApp
  // em vez de deixar o form dar 400 no envio.
  let aberta = false
  try {
    const [tipos, inscritos] = await Promise.all([
      listarTiposPublicos(PRODUTO.slug),
      contarInscritosPorTipo(PRODUTO.slug),
    ])
    const tipo = tipos.find((t) => t.tipo_id === TIPO_ID)
    aberta = !!tipo && disponibilidadeDoTipo(tipo, hojeBRT(), inscritos[TIPO_ID] ?? 0).disponivel
  } catch {
    aberta = false
  }

  return (
    <EttShell
      exigeAtivacao
      semCobranca
      voltarUrl={PRODUTO.voltarUrl}
      voltarLabel={PRODUTO.voltarLabel}
      h1={
        <>
          Trilha de <span className="text-[var(--azuris-cyan)]">Aceleração</span> · ETT
        </>
      }
      subtitulo={
        <>
          Acesso às ferramentas pra quem topa manter a rotina e não quer pagar mensalidade.{' '}
          <strong className="text-[var(--text-primary)]">Custa 1h da sua dedicação por dia.</strong>
        </>
      }
      rodape={
        <>
          Prefere sem rotina obrigatória?{' '}
          <Link href="/ett/assinatura" className="font-semibold text-[var(--azuris-cyan)] hover:underline">
            Trilha de Dedicação: R$ {MENSAL.valorCentavos / 100}/mês
          </Link>
          .
        </>
      }
    >
      <ResumoEtt
        label="Trilha de Aceleração"
        preco="R$ 0"
        unidade={`no lugar de R$ ${MENSAL.valorCentavos / 100}/mês`}
        nota="20 dias válidos por mês. Se parar, sua bolsa entra em pausa — sem multa e sem cobrança retroativa."
        inclui={INCLUI}
      />

      {aberta ? (
        <AceleracaoForm />
      ) : (
        <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6 text-sm text-[var(--text-secondary)]">
          As inscrições pela página abrem em breve. Enquanto isso,{' '}
          <a
            href={`https://wa.me/${WA_ETT}?text=${encodeURIComponent('Oi! Quero entrar na Trilha de Aceleração do ETT.')}`}
            className="font-semibold text-[var(--azuris-cyan)] underline"
          >
            fala com a gente no WhatsApp
          </a>
          .
        </div>
      )}
    </EttShell>
  )
}
