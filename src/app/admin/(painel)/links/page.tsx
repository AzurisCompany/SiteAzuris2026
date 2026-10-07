import { headers } from 'next/headers'
import { GRUPOS_LINKS } from '@/lib/links-venda'
import { PRODUTOS } from '@/lib/produtos'
import { contarInscritosPorTipo, listarTipos, type TipoIngresso } from '@/lib/tipos-ingresso'
import { escadaPorQuantidade } from '@/lib/lotes-quantidade'
import { hojeBRT } from '@/lib/format'
import LinksVenda, { type GrupoView } from './LinksVenda'

export const dynamic = 'force-dynamic'

function brl(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function LinksPage() {
  // Domínio lido no servidor (mesmo motivo de /admin/cupons): em preview sai o do preview.
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'azuris.com.br'
  const origem = `${h.get('x-forwarded-proto') ?? 'https'}://${host}`

  // Lote que vira por quantidade (VIP/Business): os lotes ficam todos ativos, então
  // o preço que vende é o do lote vigente da escada, não o menor da lista.
  const porQuantidade = GRUPOS_LINKS.flatMap((g) => g.links)
    .map((l) => l.slug)
    .filter((slug): slug is string => !!slug && !!PRODUTOS[slug]?.tipoObrigatorio && !PRODUTOS[slug]?.quantidadeMax)

  let tipos: TipoIngresso[] = []
  const inscritos: Record<string, Record<string, number>> = {}
  let erro: string | null = null
  try {
    tipos = await listarTipos()
    const contagens = await Promise.all(porQuantidade.map((slug) => contarInscritosPorTipo(slug)))
    porQuantidade.forEach((slug, i) => (inscritos[slug] = contagens[i]))
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro ao consultar o banco.'
  }

  const grupos: GrupoView[] = GRUPOS_LINKS.map((g) => ({
    titulo: g.titulo,
    links: g.links.flatMap((l) => {
      const todos = l.slug ? tipos.filter((t) => t.produto_slug === l.slug) : []
      const doProduto = todos.filter((t) => t.ativo)
      const vitrine = doProduto.filter((t) => !t.oculto)
      // Produto que vende por tipo, com todos desligados: o link abre, mas não vende — avisa.
      let status: string | null = todos.length > 0 && vitrine.length === 0 ? 'sem tipo ativo' : null
      // Produto sem tipo nenhum (ETT) cobra o preço fixo do registry.
      const fixo = l.slug && todos.length === 0 && !erro ? PRODUTOS[l.slug]?.precoCentavos : undefined
      const precos = fixo ? [fixo] : vitrine.filter((t) => t.preco_centavos > 0).map((t) => t.preco_centavos)
      const escada = l.slug && inscritos[l.slug] ? escadaPorQuantidade(todos, inscritos[l.slug], hojeBRT()) : null
      const preco = escada
        ? escada.vigente
          ? `${brl(escada.vigente.preco_centavos)} · ${escada.vigente.nome}${
              escada.restantes != null ? ` · ${escada.restantes} vaga${escada.restantes === 1 ? '' : 's'}` : ''
            }`
          : null
        : precos.length
        ? Math.min(...precos) === Math.max(...precos)
          ? brl(precos[0])
          : `${brl(Math.min(...precos))} a ${brl(Math.max(...precos))}`
        : vitrine.length
          ? 'grátis'
          : null

      if (escada?.esgotado) status = 'esgotado'

      const principal = {
        nome: l.nome,
        url: origem + l.caminho,
        visibilidade: l.visibilidade,
        nota: l.nota ?? null,
        preco,
        status,
      }
      // Tipo oculto (ex.: estudante) só vende por `?tipo=` — ganha linha própria.
      const ocultos = l.aceitaTipoNoLink
        ? doProduto
            .filter((t) => t.oculto)
            .map((t) => ({
              nome: `${l.nome} — ${t.nome}`,
              url: `${origem}${l.caminho}?tipo=${encodeURIComponent(t.tipo_id)}`,
              visibilidade: 'oculto' as const,
              nota: 'tipo oculto: só vende por este link',
              preco: t.preco_centavos > 0 ? brl(t.preco_centavos) : 'grátis',
              status: null,
            }))
        : []
      return [principal, ...ocultos]
    }),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Links de venda</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Todos os checkouts do site num lugar só, prontos pra copiar e mandar. Preço e status vêm dos tipos ativos em{' '}
          <a href="/admin/ingressos" className="underline hover:text-[var(--text-primary)]">
            Ingressos
          </a>
          . Link com desconto de parceiro fica em{' '}
          <a href="/admin/cupons" className="underline hover:text-[var(--text-primary)]">
            Cupons
          </a>
          .
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          Não deu pra ler os tipos de ingresso ({erro}). Os links continuam valendo; só faltam preço e status.
        </div>
      )}

      <LinksVenda grupos={grupos} />
    </div>
  )
}
