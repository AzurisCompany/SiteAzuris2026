// O contrato de um EVENTO PRESENCIAL vendido pelo site.
//
// Nasceu do `EVENTO_GU` ([[gubigdata/evento]]), que era o único, e virou interface
// quando o café de networking do DSSBR pediu a MESMA página com outra marca. As duas
// rotas (`/gubigdata` e `/cafe-networking`) renderizam os mesmos componentes de
// `components/evento/` — o que muda é o objeto que satisfaz este contrato.
//
// A regra que vale pros dois: **nenhuma data, preço ou nome de palestrante em texto
// fixo de página**. Tudo vem daqui, e o canário reprova `dd/mm` solto nos arquivos
// de rota (ver `lib/__tests__/gubigdata-evento.test.ts`).

export interface ItemAgenda {
  hora: string
  item: string
}

export interface Palestrante {
  nome: string
  foto: string
  tema: string
}

/** Identidade visual do produtor: quem assina o evento no topo da página. */
export interface MarcaEvento {
  /** Nome do produtor, no alt do logo e na seção "Sobre o produtor". */
  nome: string
  /** SVG/PNG em public/ — some em fundo claro, por isso o header é escuro. */
  logo: string
  /** Cor do header (hex). O logo precisa contrastar com ela. */
  corHeader: string
  /** Site do produtor — o logo linka pra cá. */
  site: string
  /** Como o site é chamado no meio de uma frase ("o site do GU BigData"). */
  siteRotulo: string
  /** Texto pequeno do canto direito do header. */
  etiqueta: string
  /** Parágrafo da seção "Sobre o produtor" (o `realizacao` do evento entra depois). */
  sobre: string
}

export interface EventoPresencial {
  /** Slug do produto no registry ([[produtos]]) — `curso_slug` da venda. */
  slug: string
  /** Rota da página do evento; o checkout é `${baseUrl}/inscricao`. */
  baseUrl: string
  /** Endpoint do checkout deste evento. */
  apiUrl: string
  titulo: string
  /** Nome do evento SEM a data — cabeçalho do checkout, onde a data já vem embaixo. */
  tituloCurto: string
  chamada: string
  /** Tema curto — card da /comunidade, OG description. */
  tema: string
  /** Selo "Nova data" no cabeçalho (evento remarcado). */
  novaData: boolean
  /** "24 de setembro" — como o dia aparece no meio de um título. */
  dataTitulo: string
  /** "24 de setembro de 2026, quinta" */
  dataLonga: string
  /** "24/09" */
  dataCurta: string
  /** "18h30" */
  inicio: string
  /** "18h30 às 21h00" */
  horario: string
  /** Description da página do evento (indexável). */
  metaDescricao: string
  /** Description do checkout (noindex). */
  checkoutDescricao: string
  local: {
    sigla: string
    nome: string
    detalhe: string
    endereco: string
    mapsUrl: string
  }
  banner: {
    src: string
    largura: number
    altura: number
    alt: string
  }
  /** Parágrafos da "Descrição do evento" — texto puro (ver gotcha do SSR com <strong>). */
  descricao: readonly string[]
  agenda: readonly ItemAgenda[]
  /** Vazio é válido: nem todo evento anuncia quem fala (o café anuncia a empresa). */
  palestrantes: readonly Palestrante[]
  /** Crédito de realização/organização, no fim da seção do produtor. */
  realizacao: string
  /** Opções do select "sou associado/participante de" do ingresso gratuito. */
  associacoes: readonly string[]
  /** Espelha `PRODUTOS[slug].enderecoObrigatorioPJ` — o form não pode discordar do servidor. */
  enderecoObrigatorioPJ: boolean
}
