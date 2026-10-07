'use client'

import { useState } from 'react'
import { copiarTexto, IconeCheck, IconeCopiar } from '../vendas/copiar'

export interface LinkView {
  nome: string
  url: string
  visibilidade: 'publico' | 'link-direto' | 'oculto'
  nota: string | null
  preco: string | null
  status: string | null
}

export interface GrupoView {
  titulo: string
  links: LinkView[]
}

const SELO: Record<LinkView['visibilidade'], { rotulo: string; classe: string; title: string }> = {
  publico: { rotulo: 'no site', classe: 'bg-emerald-500/15 text-emerald-300', title: 'Aparece no site' },
  'link-direto': {
    rotulo: 'só link',
    classe: 'bg-sky-500/15 text-sky-300',
    title: 'Fora do menu e do Google: quem compra chega por este link',
  },
  oculto: {
    rotulo: 'oculto',
    classe: 'bg-fuchsia-500/15 text-fuchsia-300',
    title: 'Tipo de ingresso fora da vitrine: só vende por este link',
  },
}

export default function LinksVenda({ grupos }: { grupos: GrupoView[] }) {
  const [busca, setBusca] = useState('')
  const [copiado, setCopiado] = useState<string | null>(null)

  const termo = busca.trim().toLowerCase()
  const filtrados = grupos
    .map((g) => ({
      ...g,
      links: termo
        ? g.links.filter((l) => `${g.titulo} ${l.nome} ${l.url}`.toLowerCase().includes(termo))
        : g.links,
    }))
    .filter((g) => g.links.length > 0)

  async function copiar(url: string) {
    await copiarTexto(url)
    setCopiado(url)
    setTimeout(() => setCopiado((atual) => (atual === url ? null : atual)), 1500)
  }

  return (
    <div className="space-y-6">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar (ex.: camiseta, vip, gu)"
        className="w-full max-w-sm rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] px-3 py-2 text-sm outline-none focus:border-[var(--azuris-cyan)]"
      />

      {filtrados.length === 0 && <p className="text-sm text-[var(--text-muted)]">Nenhum link com “{busca}”.</p>}

      {filtrados.map((g) => (
        <section key={g.titulo}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">{g.titulo}</h2>
          <ul className="divide-y divide-[var(--azuris-surface)] rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-deep)]">
            {g.links.map((l) => {
              const selo = SELO[l.visibilidade]
              const foi = copiado === l.url
              return (
                <li key={l.url} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{l.nome}</span>
                      <span title={selo.title} className={`rounded px-1.5 py-0.5 text-xs ${selo.classe}`}>
                        {selo.rotulo}
                      </span>
                      {l.preco && <span className="text-xs text-[var(--text-secondary)]">{l.preco}</span>}
                      {l.status && (
                        <span className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-xs text-yellow-300">{l.status}</span>
                      )}
                    </div>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs text-[var(--azuris-cyan)] hover:underline"
                    >
                      {l.url}
                    </a>
                    {l.nota && <p className="text-xs text-[var(--text-muted)]">{l.nota}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => copiar(l.url)}
                    className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      foi
                        ? 'border-emerald-500/40 text-emerald-300'
                        : 'border-[var(--azuris-surface)] text-[var(--text-secondary)] hover:border-[var(--azuris-cyan)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {foi ? <IconeCheck /> : <IconeCopiar />}
                    {foi ? 'Copiado' : 'Copiar link'}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
