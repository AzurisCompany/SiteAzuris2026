// E-mail do vigia das vendas — vai pra nós, não pro cliente. Lista o que está
// prestes a fechar o checkout ([[vigilancia]]).

import { Button, Section, Text } from '@react-email/components'
import { MolduraEmail, TEXTO, MARCA } from './_componentes'
import type { Alerta } from '@/lib/vigilancia'

export type AlertaVendasProps = {
  readonly alertas: ReadonlyArray<Alerta>
  readonly urlAdmin: string
}

const CAIXA = {
  critico: { borderLeft: `4px solid #dc2626`, backgroundColor: '#fef2f2' },
  aviso: { borderLeft: `4px solid #d97706`, backgroundColor: '#fffbeb' },
} as const

export function AlertaVendas({ alertas, urlAdmin }: AlertaVendasProps) {
  const criticos = alertas.filter((a) => a.severidade === 'critico').length
  return (
    <MolduraEmail
      preview={`${alertas.length} alerta(s) de venda — ${criticos} crítico(s)`}
      assinatura="Vigia de vendas — automático, uma vez por dia, só quando há o que dizer."
    >
      <Text style={TEXTO.titulo}>
        {criticos > 0 ? 'Tem checkout em risco' : 'Fique de olho nas vendas'}
      </Text>
      <Text style={TEXTO.paragrafo}>
        {alertas.length} alerta(s) hoje{criticos > 0 ? `, ${criticos} crítico(s).` : '.'}
      </Text>

      {alertas.map((a) => (
        <Section
          key={`${a.produtoSlug}:${a.tipoId ?? '-'}:${a.titulo}`}
          style={{ ...CAIXA[a.severidade], borderRadius: '6px', padding: '12px 14px', marginBottom: '10px' }}
        >
          <Text style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: MARCA.tinta }}>
            {a.severidade === 'critico' ? '🔴' : '🟡'} {a.titulo} — {a.produtoSlug}
            {a.tipoId ? ` · ${a.tipoId}` : ''}
          </Text>
          <Text style={{ margin: '4px 0 0', fontSize: '14px', lineHeight: '20px', color: MARCA.texto }}>
            {a.detalhe}
          </Text>
        </Section>
      ))}

      <Section style={{ marginTop: '24px' }}>
        <Button href={urlAdmin} style={TEXTO.botao}>
          Abrir /admin/ingressos
        </Button>
      </Section>
    </MolduraEmail>
  )
}

AlertaVendas.PreviewProps = {
  alertas: [
    {
      severidade: 'critico',
      produtoSlug: 'dss-2026',
      tipoId: 'lote-1',
      titulo: 'Restam 8 vaga(s)',
      detalhe: '"Lote 1" está com 92 de 100 vagas. É a ÚNICA opção ativa.',
    },
  ],
  urlAdmin: 'https://azuris.com.br/admin/ingressos',
} satisfies AlertaVendasProps

export default AlertaVendas
