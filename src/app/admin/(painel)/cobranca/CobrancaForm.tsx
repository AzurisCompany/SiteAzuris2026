'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { labelBilling } from '@/lib/billing'
import CampoDocumento, { type PessoaTipo } from '@/components/checkout/CampoDocumento'
import DadosNota, { notaInicial, notaParaPayload, type NotaValue } from '@/components/checkout/DadosNota'
import {
  OPCOES_COBRANCA,
  getOpcaoCobranca,
  PROPOSTA_SLUG,
  type OpcaoCobranca,
  type PrecosSugeridos,
} from '@/lib/cobranca-manual'
// Math de parcelamento (puro) direto da lib — o servidor recalcula, aqui é só PREVIEW.
import { valorParcela, valorParcelaSemJuros, MAX_PARCELAS_ADMIN, TAXA_JUROS_AM } from '@/lib/parcelamento'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Parse tolerante de valor em R$ digitado (aceita "3.800,00", "3800,00", "3800.00", "3800"). */
function parseValor(raw: string): number {
  let s = raw.replace(/[^\d.,]/g, '')
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (s.includes(',')) s = s.replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, '')
}

const campo =
  'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none placeholder:text-[var(--text-muted)]'
const rotulo = 'block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1'

interface Resultado {
  id: number
  invoiceUrl: string
  paymentId: string
  valor: number
  installments: number
  installmentValue: number
  com_juros?: boolean
  billing_type: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'
}

/** Preço de tabela → texto do campo de valor ("47000" → "470,00"). Vazio = sem sugestão. */
function prefillValor(precos: PrecosSugeridos, slug: string): string {
  const p = precos[slug]
  return p ? (p.centavos / 100).toFixed(2).replace('.', ',') : ''
}

/**
 * Cadastro de um cliente copiado de uma venda existente (link "nova cobrança com
 * estes dados"). Só os dados dele — produto, valor e descrição o admin escolhe do
 * zero, porque é justamente isso que mudou.
 */
export interface Prefill {
  nome: string
  email: string
  cpf: string
  telefone: string
  pessoaTipo: PessoaTipo
  nota: NotaValue
}

export default function CobrancaForm({ precos, prefill }: { precos: PrecosSugeridos; prefill?: Prefill }) {
  const router = useRouter()
  const [slug, setSlug] = useState<string>(PROPOSTA_SLUG)
  const [nome, setNome] = useState(prefill?.nome ?? '')
  const [email, setEmail] = useState(prefill?.email ?? '')
  const [pessoaTipo, setPessoaTipo] = useState<PessoaTipo>(prefill?.pessoaTipo ?? 'PF')
  const [cpf, setCpf] = useState(prefill?.cpf ?? '')
  const [nota, setNota] = useState<NotaValue>(prefill?.nota ?? notaInicial)
  const [telefone, setTelefone] = useState(prefill?.telefone ?? '')
  const [descricao, setDescricao] = useState('')
  const [valorRaw, setValorRaw] = useState('')
  const [metodos, setMetodos] = useState({ pix: true, boleto: false, cartao: false })
  // Parcelamento do cartão: 'cliente' = fatura Asaas decide; 'fixo' = admin fixa nº + juros.
  const [modoParcela, setModoParcela] = useState<'cliente' | 'fixo'>('cliente')
  const [parcelas, setParcelas] = useState(1)
  const [comJuros, setComJuros] = useState(true)
  const [diasVenc, setDiasVenc] = useState(3)

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [copiado, setCopiado] = useState<'link' | 'msg' | null>(null)

  const opcao = getOpcaoCobranca(slug) ?? OPCOES_COBRANCA[OPCOES_COBRANCA.length - 1]
  const precoSugerido = precos[slug] ?? null

  const valorReais = useMemo(() => parseValor(valorRaw), [valorRaw])

  // Trocar de produto reescreve descrição e valor — mas nunca por cima do que você
  // digitou: só substitui o campo vazio ou o prefill do produto anterior.
  function trocarProduto(nova: OpcaoCobranca) {
    const anterior = opcao
    setDescricao((d) => (d === '' || d === anterior.descricaoPadrao ? nova.descricaoPadrao : d))
    setValorRaw((v) =>
      v === '' || v === prefillValor(precos, anterior.slug) ? prefillValor(precos, nova.slug) : v,
    )
    setSlug(nova.slug)
  }

  // 1 meio marcado = método fixo; 2+ = UNDEFINED (cliente escolhe na fatura Asaas).
  const marcados = [
    metodos.pix && 'PIX',
    metodos.boleto && 'BOLETO',
    metodos.cartao && 'CREDIT_CARD',
  ].filter(Boolean) as Array<'PIX' | 'BOLETO' | 'CREDIT_CARD'>
  const billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED' | null =
    marcados.length === 0 ? null : marcados.length === 1 ? marcados[0] : 'UNDEFINED'
  const soCartao = billingType === 'CREDIT_CARD'
  // Parcelas mandadas ao servidor: no modo 'cliente' vai 1x (a fatura Asaas parcela);
  // no modo 'fixo' vai o nº escolhido.
  const parcelasFixas = soCartao && modoParcela === 'fixo' ? parcelas : 1

  // Preview do parcelamento — só no modo 'fixo' (o modo 'cliente' não pré-fixa nada).
  const previewParcela = useMemo(() => {
    if (!soCartao || modoParcela !== 'fixo' || valorReais <= 0) return null
    const vp = comJuros ? valorParcela(valorReais, parcelas) : valorParcelaSemJuros(valorReais, parcelas)
    const total = comJuros ? Number((vp * parcelas).toFixed(2)) : valorReais
    return { total, parcela: vp }
  }, [soCartao, modoParcela, comJuros, valorReais, parcelas])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setResultado(null)
    if (!billingType) {
      setErro('Marque ao menos um meio de pagamento.')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch('/api/admin/cobranca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          cpf_cnpj: cpf,
          telefone,
          curso_slug: slug,
          descricao,
          valor_reais: valorReais,
          billing_type: billingType,
          installments: parcelasFixas,
          com_juros: comJuros,
          dias_vencimento: diasVenc,
          ...notaParaPayload(nota, pessoaTipo, opcao.enderecoObrigatorioPJ),
        }),
      })
      const data = (await res.json()) as Resultado & { error?: string }
      if (!res.ok) {
        setErro(data.error || 'Falha ao gerar a cobrança.')
        return
      }
      setResultado(data)
      router.refresh() // atualiza a lista de cobranças abaixo do form
    } catch {
      setErro('Erro de rede. Tenta de novo.')
    } finally {
      setEnviando(false)
    }
  }

  // Mensagem pronta pro cliente (WhatsApp / copiar).
  const mensagem = useMemo(() => {
    if (!resultado) return ''
    const primeiroNome = nome.trim().split(/\s+/)[0] || ''
    const linhaParc =
      resultado.billing_type !== 'CREDIT_CARD'
        ? ''
        : resultado.installments > 1
          ? `\nParcelado em ${resultado.installments}x de ${brl(resultado.installmentValue)}${
              resultado.com_juros === false ? ' sem juros' : ''
            }.`
          : '\nNo cartão você pode parcelar na própria fatura.'
    const metodoNota =
      resultado.billing_type === 'UNDEFINED' ? ' (PIX, boleto ou cartão)'
        : resultado.billing_type === 'PIX' ? ' (PIX)'
        : resultado.billing_type === 'BOLETO' ? ' (boleto)'
        : ''
    return (
      `Olá${primeiroNome ? ', ' + primeiroNome : ''}! Segue o link pra pagamento — ${descricao.trim()}.\n` +
      `Valor: ${brl(resultado.valor)}${metodoNota}.${linhaParc}\n\n` +
      `${resultado.invoiceUrl}\n\nQualquer dúvida, é só chamar. — Azuris`
    )
  }, [resultado, nome, descricao])

  const waUrl = useMemo(() => {
    const d = onlyDigits(telefone)
    if (d.length !== 10 && d.length !== 11) return null
    return `https://wa.me/55${d}?text=${encodeURIComponent(mensagem)}`
  }, [telefone, mensagem])

  async function copiar(texto: string, qual: 'link' | 'msg') {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(qual)
      setTimeout(() => setCopiado(null), 1800)
    } catch {
      /* clipboard indisponível — ignora */
    }
  }

  function novaCobranca() {
    setResultado(null)
    setErro(null)
    // Volta pro produto atual em branco — mantém o balde, limpa os dados do cliente.
    setValorRaw(prefillValor(precos, slug))
    setDescricao(opcao.descricaoPadrao)
    setNome('')
    setEmail('')
    setCpf('')
    setTelefone('')
    setParcelas(1)
    setModoParcela('cliente')
    setComJuros(true)
    setMetodos({ pix: true, boleto: false, cartao: false })
    setDiasVenc(3)
  }

  // --- Painel de resultado ---
  if (resultado) {
    return (
      <div className="max-w-2xl space-y-5 rounded-2xl border border-[var(--accent-emerald)]/30 bg-[var(--azuris-deep)] p-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-[var(--accent-emerald)]/15 text-[var(--accent-emerald)]">
            ✓
          </span>
          <h2 className="text-lg font-bold">Cobrança criada · {brl(resultado.valor)}</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          {descricao.trim()} · venda #{resultado.id} ·{' '}
          {resultado.billing_type === 'CREDIT_CARD'
            ? resultado.installments > 1
              ? `Cartão ${resultado.installments}x${resultado.com_juros === false ? ' sem juros' : ''}`
              : 'Cartão (cliente parcela na fatura)'
            : labelBilling(resultado.billing_type)}
        </p>

        <div>
          <span className={rotulo}>Link de pagamento</span>
          <div className="flex flex-wrap items-center gap-2">
            <input readOnly value={resultado.invoiceUrl} className={`${campo} flex-1 min-w-0 font-mono text-xs`} />
            <button
              type="button"
              onClick={() => copiar(resultado.invoiceUrl, 'link')}
              className="rounded-lg border border-[var(--azuris-surface)] px-3 py-2 text-sm font-semibold hover:border-[var(--azuris-cyan)]/40"
            >
              {copiado === 'link' ? 'copiado ✓' : 'copiar link'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-emerald)] px-4 py-2 text-sm font-bold text-black hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              WhatsApp do cliente
            </a>
          )}
          <button
            type="button"
            onClick={() => copiar(mensagem, 'msg')}
            className="rounded-lg border border-[var(--azuris-surface)] px-4 py-2 text-sm font-semibold hover:border-[var(--azuris-cyan)]/40"
          >
            {copiado === 'msg' ? 'mensagem copiada ✓' : 'copiar mensagem pronta'}
          </button>
          <a
            href={resultado.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--azuris-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--azuris-cyan)]/40"
          >
            abrir fatura
          </a>
        </div>

        {!waUrl && (
          <p className="text-xs text-amber-300">
            Telefone sem WhatsApp válido — use o botão de copiar link/mensagem.
          </p>
        )}

        <div className="border-t border-[var(--azuris-surface)] pt-4">
          <button type="button" onClick={novaCobranca} className="text-sm font-semibold text-[var(--azuris-cyan)] hover:underline">
            + nova cobrança
          </button>
        </div>
      </div>
    )
  }

  // --- Formulário ---
  return (
    <form onSubmit={enviar} className="max-w-2xl space-y-5 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
      <div>
        <label className={rotulo} htmlFor="produto-cobranca">
          Produto
        </label>
        <select
          id="produto-cobranca"
          value={slug}
          onChange={(e) => {
            const o = getOpcaoCobranca(e.target.value)
            if (o) trocarProduto(o)
          }}
          className={campo}
        >
          {OPCOES_COBRANCA.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Define em qual aba do painel a venda entra (é o mesmo <code>?curso=</code> dos filtros de vendas). O valor é
          sempre o que você digitar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={rotulo}>Nome do contato</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={3} className={campo} placeholder="Fulano de Tal" />
        </div>
        <div>
          <label className={rotulo}>E-mail</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" className={campo} placeholder="cliente@empresa.com" />
        </div>
        <div>
          <label className={rotulo}>Telefone (WhatsApp)</label>
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} required inputMode="numeric" className={campo} placeholder="DDD + número" />
        </div>
      </div>

      <CampoDocumento
        tema="admin"
        pessoaTipo={pessoaTipo}
        onPessoaTipoChange={setPessoaTipo}
        valor={cpf}
        onChange={setCpf}
      />

      <DadosNota
        tema="admin"
        value={nota}
        onChange={setNota}
        pessoaTipo={pessoaTipo}
        enderecoObrigatorioPJ={opcao.enderecoObrigatorioPJ}
      />

      <div>
        <label className={rotulo}>Descrição da cobrança</label>
        <input value={descricao} onChange={(e) => setDescricao(e.target.value)} required minLength={3} className={campo} placeholder="Ex.: Lote corporativo — 8 ingressos DSSBR 2026" />
        <p className="mt-1 text-xs text-[var(--text-muted)]">Aparece na fatura do cliente e no detalhe da venda.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={rotulo}>Valor total (R$)</label>
          <input value={valorRaw} onChange={(e) => setValorRaw(e.target.value)} required inputMode="decimal" className={campo} placeholder="3.800,00" />
          {valorReais > 0 && <p className="mt-1 text-xs text-[var(--text-muted)]">= {brl(valorReais)}</p>}
          {precoSugerido && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Tabela: {brl(precoSugerido.centavos / 100)} · {precoSugerido.dica}
            </p>
          )}
        </div>
        <div>
          <label className={rotulo}>Vencimento em</label>
          <div className="flex items-center gap-2">
            <input
              value={diasVenc}
              onChange={(e) => setDiasVenc(Math.min(Math.max(Number(e.target.value) || 1, 1), 60))}
              type="number"
              min={1}
              max={60}
              className={`${campo} w-24`}
            />
            <span className="text-sm text-[var(--text-muted)]">dias</span>
          </div>
        </div>
      </div>

      <div>
        <label className={rotulo}>Formas de pagamento</label>
        <div className="flex flex-wrap gap-2">
          {([
            ['pix', 'PIX'],
            ['boleto', 'Boleto'],
            ['cartao', 'Cartão'],
          ] as const).map(([key, label]) => {
            const ativo = metodos[key]
            return (
              <button
                key={key}
                type="button"
                aria-pressed={ativo}
                onClick={() => setMetodos((m) => ({ ...m, [key]: !m[key] }))}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  ativo
                    ? 'border-[var(--azuris-cyan)] bg-[var(--azuris-cyan)]/10 text-[var(--azuris-cyan)]'
                    : 'border-[var(--azuris-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="mr-1.5">{ativo ? '✓' : '+'}</span>
                {label}
              </button>
            )
          })}
        </div>
        {billingType === null && (
          <p className="mt-2 text-xs text-amber-300">Marque ao menos um meio de pagamento.</p>
        )}
        {billingType === 'UNDEFINED' && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Cliente escolhe o meio na fatura. Atenção: o Asaas exibe <strong>todos os meios ativos na sua conta</strong>, não só
            os marcados. Sem juros pré-fixados — se pagar no cartão, o parcelamento segue as regras da conta Asaas.
          </p>
        )}
        {soCartao && (
          <div className="mt-3 space-y-3 rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] p-3">
            <div className="flex flex-wrap gap-2">
              {([
                ['cliente', 'Cliente escolhe na fatura'],
                ['fixo', 'Eu fixo as parcelas'],
              ] as const).map(([key, label]) => {
                const ativo = modoParcela === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => setModoParcela(key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      ativo
                        ? 'border-[var(--azuris-cyan)] bg-[var(--azuris-cyan)]/10 text-[var(--azuris-cyan)]'
                        : 'border-[var(--azuris-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {modoParcela === 'cliente' ? (
              <p className="text-xs text-[var(--text-muted)]">
                A fatura do Asaas mostra o seletor de parcelas e o cliente decide. Os juros seguem a configuração de
                parcelamento da sua conta Asaas.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className={rotulo}>Parcelas</label>
                    <div className="flex items-center gap-2">
                      <input
                        value={parcelas}
                        onChange={(e) =>
                          setParcelas(Math.min(Math.max(Math.round(Number(e.target.value) || 1), 1), MAX_PARCELAS_ADMIN))
                        }
                        type="number"
                        min={1}
                        max={MAX_PARCELAS_ADMIN}
                        className={`${campo} w-20`}
                      />
                      <span className="text-sm text-[var(--text-muted)]">x (até {MAX_PARCELAS_ADMIN})</span>
                    </div>
                  </div>
                  <div>
                    <label className={rotulo}>Juros</label>
                    <div className="flex gap-2">
                      {([
                        [true, 'Com juros'],
                        [false, 'Sem juros'],
                      ] as const).map(([val, label]) => {
                        const ativo = comJuros === val
                        return (
                          <button
                            key={label}
                            type="button"
                            aria-pressed={ativo}
                            onClick={() => setComJuros(val)}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                              ativo
                                ? 'border-[var(--azuris-cyan)] bg-[var(--azuris-cyan)]/10 text-[var(--azuris-cyan)]'
                                : 'border-[var(--azuris-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                {previewParcela && (
                  <p className="text-xs text-[var(--text-muted)]">
                    {parcelas === 1
                      ? `1x de ${brl(previewParcela.parcela)} (à vista)`
                      : comJuros
                        ? `${parcelas}x de ${brl(previewParcela.parcela)} = ${brl(previewParcela.total)} (juros ${(TAXA_JUROS_AM * 100).toFixed(2)}% a.m. repassados ao cliente)`
                        : `${parcelas}x de ${brl(previewParcela.parcela)} = ${brl(previewParcela.total)} (sem juros — a Azuris absorve a taxa do cartão)`}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {erro && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>}

      <button
        type="submit"
        disabled={enviando || billingType === null}
        className="rounded-lg bg-[var(--azuris-cyan)] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
      >
        {enviando ? 'gerando…' : 'Gerar link de pagamento'}
      </button>
    </form>
  )
}
