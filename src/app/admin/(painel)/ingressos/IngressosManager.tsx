'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TipoIngresso } from '@/lib/tipos-ingresso'

const brl = (centavos: number) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Parse tolerante de R$ digitado → centavos. */
function parseCentavos(raw: string): number {
  let s = raw.replace(/[^\d.,]/g, '')
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (s.includes(',')) s = s.replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}
const centavosParaInput = (c: number) => (c ? (c / 100).toFixed(2).replace('.', ',') : '')

const campo =
  'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none placeholder:text-[var(--text-muted)]'
const rotulo = 'block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1'

interface FormState {
  id?: number
  produto_slug: string
  tipo_id: string
  nome: string
  descricao: string
  precoRaw: string
  precoDeRaw: string
  pix_desconto_pct: number
  cartao_acrescimo_pct: number
  max_parcelas: number
  ativo: boolean
  oculto: boolean
  ordem: number
  vendas_ate: string // YYYY-MM-DD ou '' (sem prazo)
  limiteRaw: string // lotação; '' = sem limite
}

function formVazio(produto_slug: string): FormState {
  return {
    produto_slug,
    tipo_id: '',
    nome: '',
    descricao: '',
    precoRaw: '',
    precoDeRaw: '',
    pix_desconto_pct: 0,
    cartao_acrescimo_pct: 0,
    max_parcelas: 3,
    ativo: true,
    oculto: false,
    ordem: 0,
    vendas_ate: '',
    limiteRaw: '',
  }
}

function tipoParaForm(t: TipoIngresso): FormState {
  return {
    id: t.id,
    produto_slug: t.produto_slug,
    tipo_id: t.tipo_id,
    nome: t.nome,
    descricao: t.descricao ?? '',
    precoRaw: centavosParaInput(t.preco_centavos) || '0,00',
    precoDeRaw: centavosParaInput(t.preco_de_centavos),
    pix_desconto_pct: t.pix_desconto_pct,
    cartao_acrescimo_pct: t.cartao_acrescimo_pct,
    max_parcelas: t.max_parcelas,
    ativo: t.ativo,
    oculto: t.oculto,
    ordem: t.ordem,
    vendas_ate: t.vendas_ate ?? '',
    limiteRaw: t.limite_qtd == null ? '' : String(t.limite_qtd),
  }
}

export default function IngressosManager({
  tiposIniciais,
  produtos,
}: {
  tiposIniciais: TipoIngresso[]
  /** `checkout` é o path da página de inscrição — base do link de ingresso oculto */
  produtos: Array<{ slug: string; nome: string; checkout: string }>
}) {
  const router = useRouter()
  const produtoPadrao = produtos[0]?.slug ?? 'dss-2026'
  const [tipos, setTipos] = useState<TipoIngresso[]>(tiposIniciais)
  const [form, setForm] = useState<FormState>(formVazio(produtoPadrao))
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<number | null>(null)

  const precoCentavos = useMemo(() => parseCentavos(form.precoRaw), [form.precoRaw])
  const precoPix = Math.round(precoCentavos * (1 - form.pix_desconto_pct / 100))
  const precoCartao = Math.round(precoCentavos * (1 + form.cartao_acrescimo_pct / 100))

  const nomeProduto = (slug: string) => produtos.find((p) => p.slug === slug)?.nome ?? slug
  /** Link do ingresso oculto: o checkout do produto + `?tipo=<id>`. */
  const linkDoTipo = (slug: string, tipo_id: string) =>
    `${produtos.find((p) => p.slug === slug)?.checkout ?? '/'}?tipo=${tipo_id}`

  async function copiarLink(t: TipoIngresso) {
    const url = `${window.location.origin}${linkDoTipo(t.produto_slug, t.tipo_id)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(t.id)
      setTimeout(() => setCopiado(null), 2000)
    } catch {
      prompt('Copie o link:', url)
    }
  }

  async function recarregar() {
    const res = await fetch('/api/admin/ingressos')
    if (res.ok) {
      const data = (await res.json()) as { tipos: TipoIngresso[] }
      setTipos(data.tipos)
    }
    router.refresh() // atualiza dashboard/checkout que leem o mesmo catálogo
  }

  function editar(t: TipoIngresso) {
    setForm(tipoParaForm(t))
    setEditando(true)
    setErro(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function novo() {
    setForm(formVazio(produtoPadrao))
    setEditando(false)
    setErro(null)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    // R$ 0,00 = ingresso gratuito (válido); pago tem mínimo R$ 1,00.
    if (precoCentavos !== 0 && precoCentavos < 100) {
      setErro('Preço inválido (R$ 0,00 = grátis; pago tem mínimo R$ 1,00)')
      return
    }
    setSalvando(true)
    try {
      const res = await fetch('/api/admin/ingressos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto_slug: form.produto_slug,
          tipo_id: editando ? form.tipo_id : form.tipo_id || undefined,
          nome: form.nome,
          descricao: form.descricao,
          preco_centavos: precoCentavos,
          preco_de_centavos: parseCentavos(form.precoDeRaw),
          pix_desconto_pct: form.pix_desconto_pct,
          cartao_acrescimo_pct: form.cartao_acrescimo_pct,
          max_parcelas: form.max_parcelas,
          ativo: form.ativo,
          oculto: form.oculto,
          ordem: form.ordem,
          vendas_ate: form.vendas_ate || null,
          limite_qtd: form.limiteRaw.trim() ? Number(form.limiteRaw) : null,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setErro(data.error || 'Falha ao salvar.')
        return
      }
      novo()
      await recarregar()
    } catch {
      setErro('Erro de rede. Tenta de novo.')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo(t: TipoIngresso) {
    await fetch('/api/admin/ingressos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...t, ativo: !t.ativo }),
    })
    await recarregar()
  }

  async function remover(t: TipoIngresso) {
    if (!confirm(`Remover o tipo "${t.nome}"? (não afeta vendas já feitas)`)) return
    await fetch('/api/admin/ingressos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id }),
    })
    await recarregar()
  }

  // Agrupa pra listagem.
  const porProduto = useMemo(() => {
    const m = new Map<string, TipoIngresso[]>()
    for (const t of tipos) {
      const arr = m.get(t.produto_slug) ?? []
      arr.push(t)
      m.set(t.produto_slug, arr)
    }
    return m
  }, [tipos])

  return (
    <div className="space-y-8">
      {/* Formulário */}
      <form onSubmit={salvar} className="space-y-5 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{editando ? `Editar “${form.nome}”` : 'Novo tipo de ingresso'}</h2>
          {editando && (
            <button type="button" onClick={novo} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              cancelar edição
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={rotulo}>Produto</label>
            <select
              value={form.produto_slug}
              onChange={(e) => setForm({ ...form, produto_slug: e.target.value })}
              disabled={editando}
              className={`${campo} disabled:opacity-60`}
            >
              {produtos.map((p) => (
                <option key={p.slug} value={p.slug}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={rotulo}>Nome do tipo</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required minLength={2} className={campo} placeholder="Ex.: Estudante" />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              id: <code>{editando ? form.tipo_id : (form.tipo_id || slugPreview(form.nome) || '—')}</code>
              {editando && ' (fixo)'}
            </p>
          </div>
        </div>

        <div>
          <label className={rotulo}>Descrição (opcional)</label>
          <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={campo} placeholder="Ex.: Com comprovante de matrícula" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={rotulo}>Preço cobrado (R$)</label>
            <input value={form.precoRaw} onChange={(e) => setForm({ ...form, precoRaw: e.target.value })} required inputMode="decimal" className={campo} placeholder="470,00" />
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">0,00 = ingresso gratuito (só cadastro, sem cobrança)</p>
          </div>
          <div>
            <label className={rotulo}>Âncora “de” riscada (R$, opcional)</label>
            <input value={form.precoDeRaw} onChange={(e) => setForm({ ...form, precoDeRaw: e.target.value })} inputMode="decimal" className={campo} placeholder="820,00 — deixe vazio pra não mostrar" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={rotulo}>Vendas até (opcional)</label>
            <input type="date" value={form.vendas_ate} onChange={(e) => setForm({ ...form, vendas_ate: e.target.value })} className={campo} />
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">último dia de venda (inclusive); vazio = sem prazo</p>
          </div>
          <div>
            <label className={rotulo}>Limite de vagas (opcional)</label>
            <input type="number" min={1} value={form.limiteRaw} onChange={(e) => setForm({ ...form, limiteRaw: e.target.value })} className={campo} placeholder="vazio = sem limite" />
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">conta pagas + pendentes (sem testes); atingiu → “esgotado”</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={rotulo}>Desconto PIX (%)</label>
            <input type="number" min={0} max={100} step="0.01" value={form.pix_desconto_pct} onChange={(e) => setForm({ ...form, pix_desconto_pct: Number(e.target.value) })} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Acréscimo cartão (%)</label>
            <input type="number" min={0} max={100} step="0.01" value={form.cartao_acrescimo_pct} onChange={(e) => setForm({ ...form, cartao_acrescimo_pct: Number(e.target.value) })} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Máx. parcelas</label>
            <input type="number" min={1} max={5} value={form.max_parcelas} onChange={(e) => setForm({ ...form, max_parcelas: Number(e.target.value) })} className={campo} />
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">teto do site: 5x</p>
          </div>
          <div>
            <label className={rotulo}>Ordem</label>
            <input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} className={campo} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} className="size-4 accent-[var(--azuris-cyan)]" />
            Ativo (pode ser vendido)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.oculto} onChange={(e) => setForm({ ...form, oculto: e.target.checked })} className="size-4 accent-[var(--azuris-cyan)]" />
            Oculto — some da lista do checkout; só compra quem recebe o link
          </label>
          {form.oculto && (
            <div className="rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-4 py-3 text-xs text-[var(--text-secondary)]">
              Quem entrar no checkout normal não vê este ingresso. O link é{' '}
              <code className="text-[var(--azuris-cyan)]">
                {linkDoTipo(form.produto_slug, editando ? form.tipo_id : form.tipo_id || slugPreview(form.nome) || '…')}
              </code>
              {!editando && ' — ele passa a valer depois de salvar.'}
              <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                O link não é secreto: quem adivinhar o id compra pelo mesmo preço. Pra ingresso de estudante, a
                conferência do comprovante é na entrada do evento.
              </div>
            </div>
          )}
        </div>

        {precoCentavos > 0 ? (
          <div className="rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-4 py-3 text-xs text-[var(--text-secondary)]">
            Preview: PIX <strong className="text-[var(--accent-emerald)]">{brl(precoPix)}</strong> · cartão base{' '}
            <strong>{brl(precoCartao)}</strong> em até {form.max_parcelas}x
            {parseCentavos(form.precoDeRaw) > precoCentavos && <> · âncora <span className="line-through">{brl(parseCentavos(form.precoDeRaw))}</span></>}
          </div>
        ) : form.precoRaw.trim() ? (
          <div className="rounded-lg border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/5 px-4 py-3 text-xs text-[var(--accent-emerald)]">
            Preview: ingresso <strong>GRATUITO</strong> — o checkout só cadastra (nome/e-mail/telefone), sem cobrança no Asaas.
          </div>
        ) : null}

        {erro && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>}

        <button type="submit" disabled={salvando} className="rounded-lg bg-[var(--azuris-cyan)] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50">
          {salvando ? 'salvando…' : editando ? 'Salvar alterações' : 'Cadastrar tipo'}
        </button>
      </form>

      {/* Listagem */}
      {tipos.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Nenhum tipo cadastrado. O checkout usa o preço único padrão até você criar um.</p>
      ) : (
        [...porProduto.entries()].map(([slug, lista]) => (
          <section key={slug} className="space-y-2">
            <h3 className="text-sm font-bold text-[var(--text-secondary)]">{nomeProduto(slug)}</h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--azuris-surface)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--azuris-deep)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Preço</th>
                    <th className="px-4 py-3">PIX / Cartão</th>
                    <th className="px-4 py-3">Parcelas</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--azuris-surface)]">
                  {lista.map((t) => {
                    const pix = Math.round(t.preco_centavos * (1 - t.pix_desconto_pct / 100))
                    const cartao = Math.round(t.preco_centavos * (1 + t.cartao_acrescimo_pct / 100))
                    return (
                      <tr key={t.id} className={t.ativo ? '' : 'opacity-50'}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{t.nome}</div>
                          <div className="text-xs text-[var(--text-muted)]">
                            <code>{t.tipo_id}</code>
                            {t.descricao && ` · ${t.descricao}`}
                          </div>
                          {t.oculto && (
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-full bg-[var(--accent-violet)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-violet)]">
                                só por link
                              </span>
                              <code className="text-[10px] text-[var(--text-muted)]">
                                {linkDoTipo(t.produto_slug, t.tipo_id)}
                              </code>
                              <button
                                type="button"
                                onClick={() => copiarLink(t)}
                                className="text-[10px] font-semibold text-[var(--azuris-cyan)] hover:underline"
                              >
                                {copiado === t.id ? 'copiado!' : 'copiar link'}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {t.preco_centavos === 0 ? (
                            <span className="font-semibold text-[var(--accent-emerald)]">Grátis</span>
                          ) : (
                            <>
                              {brl(t.preco_centavos)}
                              {t.preco_de_centavos > t.preco_centavos && (
                                <span className="ml-1 text-xs text-[var(--text-muted)] line-through">{brl(t.preco_de_centavos)}</span>
                              )}
                            </>
                          )}
                          {(t.vendas_ate || t.limite_qtd != null) && (
                            <div className="text-[10px] text-[var(--text-muted)]">
                              {t.vendas_ate && <>até {t.vendas_ate.split('-').reverse().join('/')}</>}
                              {t.vendas_ate && t.limite_qtd != null && ' · '}
                              {t.limite_qtd != null && <>{t.limite_qtd} vagas</>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                          {t.preco_centavos === 0 ? '—' : <>{brl(pix)} / {brl(cartao)}</>}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{t.max_parcelas}x</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleAtivo(t)}
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              t.ativo ? 'bg-[var(--accent-emerald)]/12 text-[var(--accent-emerald)]' : 'bg-[var(--text-muted)]/12 text-[var(--text-muted)]'
                            }`}
                          >
                            {t.ativo ? 'ativo' : 'inativo'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => editar(t)} className="text-xs font-semibold text-[var(--azuris-cyan)] hover:underline">
                            editar
                          </button>
                          <button type="button" onClick={() => remover(t)} className="ml-3 text-xs font-semibold text-red-300 hover:underline">
                            remover
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  )
}

/** Preview do slug (espelho simplificado do slugify do servidor). */
function slugPreview(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
