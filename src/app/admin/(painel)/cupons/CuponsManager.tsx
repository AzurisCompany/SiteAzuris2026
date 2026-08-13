'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Trash2, Power, Plus, Shuffle, Pencil, X } from 'lucide-react'
import type { CupomComUso, TipoCupom } from '@/lib/cupons'

export interface ProdutoOpcao {
  slug: string
  nome: string
  /** caminho do checkout, pra montar o link do parceiro */
  caminho: string
}

interface Props {
  cuponsIniciais: CupomComUso[]
  produtos: ProdutoOpcao[]
  pctMax: number
}

const campo =
  'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--azuris-cyan)] focus:outline-none'
const rotulo = 'mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]'

/** Código sorteado sem caracteres que se confundem (0/O, 1/I). */
function sortearCodigo(): string {
  const alfabeto = 'ACDEFGHJKLMNPQRTUVWXY2346789'
  const bloco = (n: number) =>
    Array.from({ length: n }, () => alfabeto[Math.floor(Math.random() * alfabeto.length)]).join('')
  return `${bloco(4)}-${bloco(4)}`
}

const brl = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Formulario {
  id?: number
  nome: string
  codigo: string
  tipo: TipoCupom
  produto_slug: string
  pct: string
  validade_horas: string
  limite_usos: string
}

function formVazio(tipo: TipoCupom, produtoSlug: string): Formulario {
  return {
    nome: '',
    codigo: sortearCodigo(),
    tipo,
    produto_slug: produtoSlug,
    pct: tipo === 'parceiro' ? '15' : '10',
    validade_horas: tipo === 'parceiro' ? '' : '48',
    limite_usos: '',
  }
}

export default function CuponsManager({ cuponsIniciais, produtos, pctMax }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<Formulario | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)

  const set = (patch: Partial<Formulario>) => setForm((f) => (f ? { ...f, ...patch } : f))

  function abrirNovo(tipo: TipoCupom) {
    setErro(null)
    setForm(formVazio(tipo, produtos[0]?.slug ?? ''))
  }

  function abrirEdicao(c: CupomComUso) {
    setErro(null)
    setForm({
      id: c.id,
      nome: c.nome,
      codigo: c.codigo,
      tipo: c.tipo,
      produto_slug: c.produto_slug,
      pct: String(c.pct),
      validade_horas: c.validade_horas == null ? '' : String(c.validade_horas),
      limite_usos: c.limite_usos == null ? '' : String(c.limite_usos),
    })
  }

  async function chamar(metodo: 'POST' | 'DELETE', corpo: unknown): Promise<boolean> {
    setSalvando(true)
    setErro(null)
    try {
      const res = await fetch('/api/admin/cupons', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data?.error ?? 'Não deu pra salvar.')
        return false
      }
      router.refresh()
      return true
    } catch {
      setErro('Erro de rede.')
      return false
    } finally {
      setSalvando(false)
    }
  }

  async function salvar() {
    if (!form) return
    const ok = await chamar('POST', {
      nome: form.nome,
      codigo: form.codigo,
      tipo: form.tipo,
      produto_slug: form.produto_slug,
      pct: Number(form.pct),
      validade_horas: form.validade_horas ? Number(form.validade_horas) : null,
      limite_usos: form.limite_usos ? Number(form.limite_usos) : null,
      ativo: true,
    })
    if (ok) setForm(null)
  }

  async function alternarAtivo(c: CupomComUso) {
    await chamar('POST', { ...c, ativo: !c.ativo })
  }

  async function excluir(c: CupomComUso) {
    if (!confirm(`Excluir o cupom de ${c.nome}? Os links dele param de funcionar imediatamente.`)) return
    await chamar('DELETE', { id: c.id })
  }

  function linkDoCupom(c: CupomComUso): string | null {
    if (c.validade_horas != null) return null // vendedora: link é gerado em /vendas
    const p = produtos.find((x) => x.slug === c.produto_slug)
    if (!p) return null
    return `${window.location.origin}${p.caminho}?c=${c.codigo}`
  }

  async function copiar(texto: string, chave: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(chave)
      setTimeout(() => setCopiado(null), 2500)
    } catch {
      setErro('Não consegui copiar — seleciona o texto e copia na mão.')
    }
  }

  const vendedoras = cuponsIniciais.filter((c) => c.tipo === 'vendedora')
  const parceiros = cuponsIniciais.filter((c) => c.tipo === 'parceiro')

  return (
    <div className="space-y-8">
      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>
      )}

      {/* --- Formulário (só aparece ao adicionar/editar) --- */}
      {form && (
        <div className="rounded-2xl border-2 border-[var(--azuris-cyan)]/50 bg-[var(--azuris-deep)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {form.id ? 'Editando' : form.tipo === 'parceiro' ? 'Novo parceiro' : 'Nova vendedora'}
            </h2>
            <button onClick={() => setForm(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="size-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={rotulo}>{form.tipo === 'parceiro' ? 'Nome do parceiro' : 'Nome da vendedora'}</label>
              <input
                value={form.nome}
                onChange={(e) => set({ nome: e.target.value })}
                placeholder={form.tipo === 'parceiro' ? 'Ex.: Gaio Consultoria' : 'Ex.: Celeste'}
                className={campo}
                autoFocus
              />
            </div>

            <div>
              <label className={rotulo}>
                {form.tipo === 'parceiro' ? 'Código (aparece no link)' : 'Senha dela (ela digita em /vendas)'}
              </label>
              <div className="flex gap-2">
                <input
                  value={form.codigo}
                  onChange={(e) => set({ codigo: e.target.value })}
                  className={`${campo} font-mono`}
                />
                <button
                  onClick={() => set({ codigo: sortearCodigo() })}
                  title="Sortear um código forte"
                  className="shrink-0 rounded-lg border border-[var(--azuris-surface)] px-3 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--azuris-cyan)] hover:text-[var(--azuris-cyan)]"
                >
                  <Shuffle className="size-4" />
                </button>
              </div>
            </div>

            <div>
              <label className={rotulo}>Desconto (%)</label>
              <input
                type="number"
                min={1}
                max={pctMax}
                value={form.pct}
                onChange={(e) => set({ pct: e.target.value })}
                className={campo}
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">Máximo permitido: {pctMax}%.</p>
            </div>

            <div>
              <label className={rotulo}>Produto</label>
              <select
                value={form.produto_slug}
                onChange={(e) => set({ produto_slug: e.target.value })}
                className={campo}
              >
                {produtos.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={rotulo}>Prazo do link</label>
              <input
                type="number"
                min={1}
                value={form.validade_horas}
                onChange={(e) => set({ validade_horas: e.target.value })}
                placeholder="em branco = sem prazo"
                className={campo}
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {form.validade_horas
                  ? `Cada link gerado morre ${form.validade_horas}h depois.`
                  : 'Link fixo, sem validade — só para de valer quando você desligar aqui.'}
              </p>
            </div>

            <div>
              <label className={rotulo}>Limite de inscrições (opcional)</label>
              <input
                type="number"
                min={1}
                value={form.limite_usos}
                onChange={(e) => set({ limite_usos: e.target.value })}
                placeholder="em branco = sem limite"
                className={campo}
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">Atingiu o número, o cupom para de descontar.</p>
            </div>
          </div>

          <button
            onClick={salvar}
            disabled={salvando}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-[var(--azuris-cyan)] to-[var(--accent-violet)] px-6 py-3.5 text-base font-bold text-white disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : form.id ? 'Salvar alterações' : 'Cadastrar'}
          </button>
        </div>
      )}

      {/* --- Vendedoras --- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Vendedoras</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Cada uma entra em <code className="text-[var(--azuris-cyan)]">azuris.com.br/vendas</code>, digita a senha
              dela e recebe um link novo pra mandar pro cliente. O link morre no prazo.
            </p>
          </div>
          <button
            onClick={() => abrirNovo('vendedora')}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-[var(--azuris-cyan)] bg-[var(--azuris-cyan)]/10 px-4 py-2.5 text-sm font-bold text-[var(--azuris-cyan)] hover:bg-[var(--azuris-cyan)]/20"
          >
            <Plus className="size-4" /> Adicionar vendedora
          </button>
        </div>

        {vendedoras.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--azuris-surface)] p-6 text-center text-sm text-[var(--text-muted)]">
            Nenhuma vendedora cadastrada. Enquanto estiver vazio, ninguém consegue gerar link em /vendas.
          </p>
        ) : (
          <div className="space-y-2">
            {vendedoras.map((c) => (
              <Linha
                key={c.id}
                c={c}
                link={null}
                copiado={copiado}
                onCopiar={copiar}
                onEditar={abrirEdicao}
                onAlternar={alternarAtivo}
                onExcluir={excluir}
                ocupado={salvando}
              />
            ))}
          </div>
        )}
      </section>

      {/* --- Parceiros --- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Parceiros</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Link fixo, sem prazo, pronto pra divulgação. Você copia aqui e manda pro parceiro — ele mesmo não precisa
              acessar nada. Só para de valer quando você desligar.
            </p>
          </div>
          <button
            onClick={() => abrirNovo('parceiro')}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-[var(--accent-emerald)] bg-[var(--accent-emerald)]/10 px-4 py-2.5 text-sm font-bold text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)]/20"
          >
            <Plus className="size-4" /> Adicionar parceiro
          </button>
        </div>

        {parceiros.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--azuris-surface)] p-6 text-center text-sm text-[var(--text-muted)]">
            Nenhum parceiro cadastrado.
          </p>
        ) : (
          <div className="space-y-2">
            {parceiros.map((c) => (
              <Linha
                key={c.id}
                c={c}
                link={linkDoCupom(c)}
                copiado={copiado}
                onCopiar={copiar}
                onEditar={abrirEdicao}
                onAlternar={alternarAtivo}
                onExcluir={excluir}
                ocupado={salvando}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Linha({
  c,
  link,
  copiado,
  onCopiar,
  onEditar,
  onAlternar,
  onExcluir,
  ocupado,
}: {
  c: CupomComUso
  link: string | null
  copiado: string | null
  onCopiar: (texto: string, chave: string) => void
  onEditar: (c: CupomComUso) => void
  onAlternar: (c: CupomComUso) => void
  onExcluir: (c: CupomComUso) => void
  ocupado: boolean
}) {
  const esgotado = c.limite_usos != null && c.usos >= c.limite_usos
  return (
    <div
      className={`rounded-xl border p-4 ${
        c.ativo ? 'border-[var(--azuris-surface)] bg-[var(--azuris-deep)]' : 'border-[var(--azuris-surface)]/50 bg-transparent opacity-60'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-base">{c.nome}</strong>
            <span className="rounded-full bg-[var(--accent-emerald)]/15 px-2 py-0.5 text-xs font-bold text-[var(--accent-emerald)]">
              {c.pct}% off
            </span>
            {!c.ativo && (
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-300">desligado</span>
            )}
            {esgotado && c.ativo && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-300">
                limite atingido
              </span>
            )}
          </div>
          <div className="mt-1 font-mono text-sm text-[var(--azuris-cyan)]">{c.codigo}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {c.validade_horas != null ? `link vale ${c.validade_horas}h` : 'link sem prazo'}
            {c.limite_usos != null && ` · limite de ${c.limite_usos}`}
          </div>
        </div>

        <div className="text-right text-sm">
          <div className="font-bold">
            {c.usos} {c.usos === 1 ? 'inscrição' : 'inscrições'}
          </div>
          <div className="text-xs text-[var(--text-muted)]">{brl(c.receita_centavos)} recebidos</div>
        </div>
      </div>

      {link && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-[var(--azuris-ink)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            {link}
          </code>
          <button
            onClick={() => onCopiar(link, `link-${c.id}`)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--azuris-cyan)]/40 bg-[var(--azuris-cyan)]/10 px-3 py-2 text-xs font-bold text-[var(--azuris-cyan)] hover:bg-[var(--azuris-cyan)]/20"
          >
            {copiado === `link-${c.id}` ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copiado === `link-${c.id}` ? 'copiado' : 'copiar link'}
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => onEditar(c)}
          disabled={ocupado}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--azuris-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
        >
          <Pencil className="size-3.5" /> editar
        </button>
        <button
          onClick={() => onAlternar(c)}
          disabled={ocupado}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--azuris-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
        >
          <Power className="size-3.5" /> {c.ativo ? 'desligar' : 'ligar'}
        </button>
        <button
          onClick={() => onExcluir(c)}
          disabled={ocupado}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
        >
          <Trash2 className="size-3.5" /> excluir
        </button>
      </div>
    </div>
  )
}
