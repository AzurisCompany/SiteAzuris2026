// Template do e-mail de pagamento confirmado. O texto NÃO nasce aqui — vem de
// [[conteudo]] (módulo puro, testável); aqui só existe a diagramação.

import { Button, Section, Text } from '@react-email/components'
import { MolduraEmail, TEXTO } from './_componentes'
import type { ConteudoEmail } from '@/lib/email/conteudo'

export type CompraConfirmadaProps = { readonly conteudo: ConteudoEmail }

export function CompraConfirmada({ conteudo }: CompraConfirmadaProps) {
  return (
    <MolduraEmail preview={conteudo.destaque}>
      <Text style={TEXTO.titulo}>{conteudo.titulo}</Text>
      <Text style={TEXTO.destaque}>{conteudo.destaque}</Text>
      {conteudo.paragrafos.map((p) => (
        <Text key={p} style={TEXTO.paragrafo}>
          {p}
        </Text>
      ))}
      {conteudo.cta && (
        <Section style={{ marginTop: '24px' }}>
          <Button href={conteudo.cta.url} style={TEXTO.botao}>
            {conteudo.cta.label}
          </Button>
        </Section>
      )}
    </MolduraEmail>
  )
}

CompraConfirmada.PreviewProps = {
  conteudo: {
    assunto: 'Adesão confirmada — English Talk Time',
    titulo: 'Pagamento confirmado, Binhara!',
    destaque: 'Recebemos R$ 67,00 da sua adesão ao English Talk Time.',
    paragrafos: ['Primeiro parágrafo de exemplo.', 'Segundo parágrafo de exemplo.'],
    cta: { label: 'Conhecer o ETT', url: 'https://englishtalktime.com.br' },
  },
} satisfies CompraConfirmadaProps

export default CompraConfirmada
