// Peças compartilhadas dos e-mails (react-email). Componentes React puros — sem
// 'server-only', sem acesso a env: dá pra renderizar em teste e no preview.
//
// Estilo em `style` inline, não Tailwind: cliente de e-mail é um navegador de
// 2003 e o que sobrevive é CSS inline em tabela. Fundo claro de propósito — o
// site é escuro, mas e-mail escuro quebra em metade dos clientes.

import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'
import type { ReactNode } from 'react'

export const MARCA = {
  cyan: '#22b8cf',
  tinta: '#0b1220',
  texto: '#1f2937',
  suave: '#6b7280',
  borda: '#e5e7eb',
  fundo: '#f3f4f6',
} as const

const ESTILO = {
  body: { backgroundColor: MARCA.fundo, fontFamily: 'Helvetica, Arial, sans-serif', padding: '32px 0' },
  container: { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px' },
  marca: { margin: 0, fontSize: '18px', fontWeight: 800, color: MARCA.tinta, letterSpacing: '-0.02em' },
  hr: { margin: '24px 0', border: 'none', borderTop: `1px solid ${MARCA.borda}` },
  rodape: { margin: '4px 0 0', fontSize: '12px', lineHeight: '18px', color: MARCA.suave },
  link: { color: MARCA.cyan, textDecoration: 'none' },
} as const

export const TEXTO = {
  paragrafo: { margin: '0 0 12px', fontSize: '15px', lineHeight: '24px', color: MARCA.texto },
  titulo: { margin: '0 0 16px', fontSize: '22px', lineHeight: '30px', fontWeight: 700, color: MARCA.tinta },
  destaque: {
    margin: '0 0 20px',
    padding: '14px 16px',
    backgroundColor: '#ecfeff',
    borderRadius: '8px',
    fontSize: '15px',
    lineHeight: '22px',
    color: MARCA.texto,
  },
  botao: {
    display: 'inline-block',
    boxSizing: 'border-box' as const,
    backgroundColor: MARCA.cyan,
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 700,
    textDecoration: 'none',
  },
} as const

export function MolduraEmail({
  preview,
  children,
  assinatura = 'Azuris — engenharia de dados',
}: {
  readonly preview: string
  readonly children: ReactNode
  readonly assinatura?: string
}) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={ESTILO.body}>
        <Container style={ESTILO.container}>
          <Section>
            <Text style={ESTILO.marca}>Azuris</Text>
          </Section>
          <Hr style={ESTILO.hr} />
          {children}
          <Hr style={ESTILO.hr} />
          <Text style={ESTILO.rodape}>{assinatura}</Text>
          <Text style={ESTILO.rodape}>
            Dúvida? É só responder este e-mail ou falar no{' '}
            <Link href="https://wa.me/5541998003687" style={ESTILO.link}>
              WhatsApp (41) 99800-3687
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
