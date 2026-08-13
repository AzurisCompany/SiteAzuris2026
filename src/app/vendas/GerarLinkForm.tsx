'use client'

import { useState, type FormEvent } from 'react'
import { Copy, Check, Link2, Clock, MessageCircle } from 'lucide-react'

interface Resposta {
  vendedora: { nome: string; slug: string }
  cliente: string | null
  caminho: string
  token: string
  utm: { source: string; medium: string; content: string }
  pct: number
  horas: number
  expiraLabel: string
}

const campo =
  'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-3 text-base placeholder:text-[var(--text-muted)] focus:border-[var(--azuris-cyan)] focus:outline-none'

/**
 * Monta a URL final no NAVEGADOR, a partir da origem da própria página — em
 * produção sai azuris.com.br, em preview sai o domínio do preview, sem env nova.
 * As utm_* vão na URL pro GA4 enxergar; a atribuição que conta pra comissão é
 * carimbada no servidor, a partir do token.
 */
function montarLink(r: Resposta): string {
  const u = new URL(r.caminho, window.location.origin)
  u.searchParams.set('d', r.token)
  u.searchParams.set('utm_source', r.utm.source)
  u.searchParams.set('utm_medium', r.utm.medium)
  u.searchParams.set('utm_content', r.utm.content)
  return u.toString()
}

function mensagemWhatsapp(r: Resposta, link: string): string {
  const saudacao = r.cliente ? `Oi, ${r.cliente}! ` : 'Oi! '
  return (
    `${saudacao}Segue seu link com ${r.pct}% de desconto no ingresso FullPass do ` +
    `Data Science Summit Brasil 2026 — 27 a 29 de outubro, em Curitiba.\n\n${link}\n\n` +
    `O desconto vale até ${r.expiraLabel}.`
  )
}

export default function GerarLinkForm() {
  const [codigo, setCodigo] = useState('')
  const [cliente, setCliente] = useState('')
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ r: Resposta; link: string } | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setGerando(true)
    setResultado(null)
    try {
      const res = await fetch('/api/vendas/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo.trim(), cliente: cliente.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data?.error ?? 'Não deu pra gerar o link. Tenta de novo.')
        return
      }
      const r = data as Resposta
      setResultado({ r, link: montarLink(r) })
      setCopiado(false)
    } catch {
      setErro('Erro de rede. Confere a internet e tenta de novo.')
    } finally {
      setGerando(false)
    }
  }

  async function copiar(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Clipboard bloqueado (http, permissão negada): o link fica selecionável na tela.
      setErro('Não consegui copiar automático — segura em cima do link e copia na mão.')
    }
  }

  if (resultado) {
    const { r, link } = resultado
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 p-5">
          <p className="text-sm text-[var(--text-secondary)]">
            Link de <strong className="text-[var(--text-primary)]">{r.vendedora.nome}</strong>
            {r.cliente && <> pra {r.cliente}</>} — <strong className="text-[var(--accent-emerald)]">{r.pct}% off</strong>
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
            <Clock className="size-4 text-[var(--accent-emerald)]" />
            Vale até {r.expiraLabel}
          </p>
          <p className="mt-3 break-all rounded-lg bg-[var(--azuris-ink)] p-3 font-mono text-xs text-[var(--text-secondary)] select-all">
            {link}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => copiar(link)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--azuris-cyan)] bg-[var(--azuris-cyan)]/10 px-5 py-4 text-base font-bold text-[var(--azuris-cyan)] transition-all hover:bg-[var(--azuris-cyan)]/20"
          >
            {copiado ? <Check className="size-5" /> : <Copy className="size-5" />}
            {copiado ? 'Copiado!' : 'Copiar link'}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensagemWhatsapp(r, link))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5"
          >
            <MessageCircle className="size-5" />
            Enviar no WhatsApp
          </a>
        </div>

        {erro && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>
        )}

        <button
          onClick={() => {
            setResultado(null)
            setCliente('')
            setErro(null)
          }}
          className="w-full rounded-xl border border-[var(--azuris-surface)] px-5 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          Gerar outro link
        </button>

        <p className="text-center text-xs text-[var(--text-muted)]">
          Cada cliente pode ter o seu link. Depois de {r.expiraLabel} esse aqui para de dar desconto sozinho — e o
          checkout volta ao preço normal.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Seu código</label>
        <input
          required
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="EX: ANA-7K2M"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className={`${campo} font-mono tracking-wider`}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
          Nome do cliente <span className="text-[var(--text-muted)]">(opcional)</span>
        </label>
        <input
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          placeholder="pra mensagem do WhatsApp sair personalizada"
          className={campo}
        />
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>
      )}

      <button
        type="submit"
        disabled={gerando}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--azuris-cyan)] to-[var(--accent-violet)] px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
      >
        <Link2 className="size-5" />
        {gerando ? 'Gerando…' : 'Gerar link com desconto'}
      </button>
    </form>
  )
}
