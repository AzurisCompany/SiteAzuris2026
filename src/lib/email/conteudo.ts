// O QUE cada e-mail diz, por produto. Módulo puro: sem Resend, sem env, sem DB —
// só entra dado e sai texto. É o que dá pra testar sem mandar e-mail pra ninguém.
//
// Um pagamento confirmado não é a mesma notícia em todo produto: ingresso de
// evento precisa de data e local, curso precisa do acesso, e o ETT tem
// fulfillment MANUAL (alguém abre a conta na mão) — prometer acesso imediato ali
// seria mentira. Por isso o texto muda por `curso_slug` em vez de ser genérico.

export interface DadosCompra {
  nome: string
  /** curso_slug da inscrição */
  produtoSlug: string
  valorCentavos: number
  /** tipo de ingresso, quando o produto tem catálogo (ex.: 'lote-1') */
  tipoIngresso?: string | null
}

export interface ConteudoEmail {
  assunto: string
  titulo: string
  /** frase em destaque, logo abaixo do título */
  destaque: string
  paragrafos: string[]
  cta?: { label: string; url: string }
}

/** Primeiro nome, pra tratar a pessoa como gente e não como cadastro. */
export function primeiroNome(nome: string): string {
  const limpo = nome.trim().replace(/\s+/g, ' ')
  if (!limpo) return 'Olá'
  return limpo.split(' ')[0]
}

/** R$ 1.234,56 — sem depender de Intl com locale, que varia por runtime. */
export function valorBRL(centavos: number): string {
  const inteiro = Math.floor(Math.abs(centavos) / 100)
  const cents = String(Math.abs(centavos) % 100).padStart(2, '0')
  const milhar = inteiro.toLocaleString('pt-BR')
  return `${centavos < 0 ? '-' : ''}R$ ${milhar},${cents}`
}

const DSS_LOCAL = '27 a 29 de outubro, no IEP, em Curitiba'

export function conteudoCompraConfirmada(d: DadosCompra): ConteudoEmail {
  const nome = primeiroNome(d.nome)
  const valor = valorBRL(d.valorCentavos)

  switch (d.produtoSlug) {
    case 'ett-adesao':
      return {
        assunto: 'Adesão confirmada — English Talk Time',
        titulo: `Pagamento confirmado, ${nome}!`,
        destaque: `Recebemos ${valor} da sua adesão ao English Talk Time.`,
        paragrafos: [
          'Sua adesão dá 2 encontros de 1 hora individuais, material didático personalizado, entrada nos encontros de conversação, conta no ETT Player e na sala do ETT Speak, e os 30 primeiros dias de plataforma.',
          'A liberação da sua conta e o agendamento dos dois encontros são feitos por nós, na mão — chamamos você no WhatsApp em até 1 dia útil pra combinar os horários.',
          'Não precisa fazer nada agora. Se em 1 dia útil ninguém tiver falado com você, responde este e-mail que a gente resolve.',
        ],
        cta: { label: 'Conhecer o ETT', url: 'https://englishtalktime.com.br' },
      }

    case 'ett-assinatura':
      return {
        assunto: 'Assinatura ativa — Trilha de Dedicação (ETT)',
        titulo: `Assinatura ativa, ${nome}!`,
        destaque: `Recebemos ${valor} do primeiro ciclo da sua Trilha de Dedicação.`,
        paragrafos: [
          'Você tem o ETT Player completo — as 10 ferramentas —, os encontros online e presenciais, e o acompanhamento da sua evolução pelo sistema.',
          'Se pagou no cartão, a renovação é automática. No PIX ou boleto, a cobrança do próximo ciclo chega por e-mail antes do vencimento.',
          'Pra cancelar, é só responder este e-mail ou chamar no WhatsApp — sem multa e sem letra miúda.',
        ],
        cta: { label: 'Conhecer o ETT', url: 'https://englishtalktime.com.br' },
      }

    case 'dss-2026':
      return {
        assunto: 'Ingresso confirmado — DSS 2026',
        titulo: `Ingresso garantido, ${nome}!`,
        destaque: `Recebemos ${valor} do seu Full Pass do Data Science Summit Brasil 2026.`,
        paragrafos: [
          `O congresso é de ${DSS_LOCAL}. Seu ingresso dá acesso aos três dias.`,
          'Perto do evento mandamos o e-mail com credenciamento, grade e tudo o que você precisa saber pra chegar.',
          'Guarde este e-mail: ele é o seu comprovante.',
        ],
        cta: { label: 'Ver a página do DSS 2026', url: 'https://azuris.com.br/dssbr-2026' },
      }

    case 'dss-one-day-2026':
      return {
        assunto: 'Passe One Day confirmado — DSS 2026',
        titulo: `Passe garantido, ${nome}!`,
        destaque: `Recebemos ${valor} do seu Passe One Day do DSS 2026.`,
        paragrafos: [
          `O congresso é de ${DSS_LOCAL}. Seu passe vale por 1 dia de evento — você escolhe qual no credenciamento.`,
          'Perto da data mandamos credenciamento e grade pra você decidir o melhor dia.',
          'Guarde este e-mail: ele é o seu comprovante.',
        ],
        cta: { label: 'Ver a página do DSS 2026', url: 'https://azuris.com.br/dssbr-2026' },
      }

    case 'dss-one-day-curso-2026':
      return {
        assunto: 'One Day + curso confirmados — DSS 2026',
        titulo: `Tudo certo, ${nome}!`,
        destaque: `Recebemos ${valor} do combo Passe One Day + portal do curso.`,
        paragrafos: [
          `O congresso é de ${DSS_LOCAL}, e seu passe vale por 1 dia de evento.`,
          'O acesso ao portal do curso "Lakehouse: Pipeline na Prática" é liberado por nós, na mão — chega no seu e-mail em até 1 dia útil.',
          'Se em 1 dia útil o acesso não tiver chegado, responde este e-mail que a gente destrava.',
        ],
        cta: { label: 'Ver a página do DSS 2026', url: 'https://azuris.com.br/dssbr-2026' },
      }

    // Encontros do GU: o texto não cita data, então serve pro corrente e pros passados.
    case 'gubigdata-2026-08':
    case 'gubigdata-2026-07':
      return {
        assunto: 'Inscrição confirmada — GU BigData & IA',
        titulo: `Inscrição confirmada, ${nome}!`,
        destaque: `Recebemos ${valor} da sua inscrição no encontro do GU BigData & IA.`,
        paragrafos: [
          'Apresente este e-mail na entrada. A gente se vê lá.',
        ],
      }

    case 'lakehouse-comunidade':
      return {
        assunto: 'Matrícula confirmada — Lakehouse: Pipeline na Prática',
        titulo: `Matrícula confirmada, ${nome}!`,
        destaque: `Recebemos ${valor} da sua matrícula no curso Lakehouse: Pipeline na Prática.`,
        paragrafos: [
          'O curso é em andamento e autoguiado: você entra quando quiser, assiste às aulas gravadas, participa dos encontros ao vivo e tem sessões 1:1 pra destravar.',
          'O acesso ao portal é liberado por nós, na mão — chega no seu e-mail em até 1 dia útil.',
          'Se em 1 dia útil o acesso não tiver chegado, responde este e-mail que a gente destrava.',
        ],
      }

    default:
      // Proposta customizada, cobrança avulsa, produto novo ainda sem texto: o
      // e-mail genérico é curto de propósito — melhor dizer pouco e certo do que
      // prometer um fulfillment que este produto talvez não tenha.
      return {
        assunto: 'Pagamento confirmado — Azuris',
        titulo: `Pagamento confirmado, ${nome}!`,
        destaque: `Recebemos ${valor}. Obrigado!`,
        paragrafos: [
          'Este e-mail é o seu comprovante. Qualquer dúvida sobre o que foi contratado, é só responder aqui.',
        ],
      }
  }
}
