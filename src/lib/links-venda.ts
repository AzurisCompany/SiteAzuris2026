// Catálogo dos links de venda que existem no site, pro /admin/links: um lugar só
// onde copiar o link do checkout de cada produto. Página de checkout nova (ou que
// sai do ar) entra/sai AQUI — o canário `links-venda.test.ts` reprova link pra
// rota que não existe em `src/app`.
import { EVENTO_GU_SLUG } from '@/app/gubigdata/evento'
import { CAFE_SLUG } from '@/app/cafe-networking/evento'

export type Visibilidade = 'publico' | 'link-direto'

export interface LinkVenda {
  nome: string
  caminho: string
  /** produto no registry/tipos_ingresso — liga o status (ativo, preço) do banco */
  slug?: string
  /** 'link-direto' = fora da vitrine (noindex, sem botão no site): só vende por este link */
  visibilidade: Visibilidade
  /** a página aplica `?tipo=<tipo_id>` — então tipo OCULTO ganha link próprio */
  aceitaTipoNoLink?: boolean
  nota?: string
}

export interface GrupoLinks {
  titulo: string
  links: LinkVenda[]
}

export const GRUPOS_LINKS: GrupoLinks[] = [
  {
    titulo: 'DSS 2026 — ingressos',
    links: [
      { nome: 'Landing do DSS 2026', caminho: '/dssbr-2026', visibilidade: 'publico', nota: 'todos os ingressos encerrados (VIP, o último, em 21/10); aponta pro WhatsApp' },
    ],
  },
  {
    titulo: 'DSS 2026 — camisetas',
    links: [
      { nome: 'Camiseta — palestrantes', caminho: '/dssbr-2026/camiseta', slug: 'camiseta-dss-2026', visibilidade: 'link-direto' },
      { nome: 'Camiseta — congressistas', caminho: '/dssbr-2026/camiseta-congressista', slug: 'camiseta-congressista-dss-2026', visibilidade: 'link-direto' },
    ],
  },
  {
    titulo: 'DSS 2027',
    links: [
      { nome: 'FullPass Pre-Load — R$ 550 (50 ingressos)', caminho: '/dssbr-2027/preload', slug: 'dss-2027-preload', visibilidade: 'link-direto' },
      { nome: 'FullPass + Curso Pipeline (nova turma) — R$ 755', caminho: '/dssbr-2027/fullpass-curso', slug: 'dss-2027-fullpass-curso', visibilidade: 'link-direto', nota: 'liberar o curso na mão depois do pagamento' },
    ],
  },
  {
    titulo: 'DSS 2026 — Upgrade Elite (certificado)',
    links: [
      { nome: 'Certificado — escolher (digital ou impresso)', caminho: '/dssbr-2026/certificado-elite', visibilidade: 'link-direto' },
      { nome: 'Certificado digital — R$ 30', caminho: '/dssbr-2026/certificado-elite/digital', slug: 'certificado-elite-digital-dss-2026', visibilidade: 'link-direto' },
      { nome: 'Certificado impresso — R$ 50', caminho: '/dssbr-2026/certificado-elite/impresso', slug: 'certificado-elite-impresso-dss-2026', visibilidade: 'link-direto' },
    ],
  },
  {
    titulo: 'Eventos presenciais',
    links: [
      { nome: 'GU BigData — página do encontro', caminho: '/gubigdata', visibilidade: 'publico' },
      { nome: 'GU BigData — inscrição', caminho: '/gubigdata/inscricao', slug: EVENTO_GU_SLUG, visibilidade: 'publico', aceitaTipoNoLink: true },
      { nome: 'Café de networking — página', caminho: '/cafe-networking', visibilidade: 'publico' },
      { nome: 'Café de networking — inscrição', caminho: '/cafe-networking/inscricao', slug: CAFE_SLUG, visibilidade: 'publico', aceitaTipoNoLink: true },
    ],
  },
  {
    titulo: 'Cursos e assinaturas',
    links: [
      { nome: 'Curso Lakehouse — inscrição', caminho: '/lakehouse-comunidade/inscricao', visibilidade: 'publico', nota: 'lote no próprio fluxo do curso' },
      { nome: 'Curso Lakehouse — página', caminho: '/lakehouse-comunidade', visibilidade: 'publico' },
      { nome: 'ETT — ativação acompanhada (R$97)', caminho: '/ett/ativacao', slug: 'ett-adesao', visibilidade: 'publico' },
      { nome: 'ETT — Trilha de Dedicação (R$37/mês)', caminho: '/ett/assinatura', visibilidade: 'publico' },
      { nome: 'ETT — Trilha de Aceleração (R$0)', caminho: '/ett/aceleracao', visibilidade: 'publico', nota: 'inscrição sem pagamento' },
      { nome: 'Preparatório de Dados — reserva', caminho: '/preparatorio-dados/reserva', visibilidade: 'publico', nota: 'captação de lead, sem pagamento' },
    ],
  },
  {
    titulo: 'Equipe',
    links: [
      { nome: 'Gerador de link de desconto (vendedoras)', caminho: '/vendas', visibilidade: 'link-direto' },
    ],
  },
]
