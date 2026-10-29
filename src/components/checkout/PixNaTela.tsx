'use client'

import { useEffect, useState } from 'react'

// PIX pago na NOSSA tela ([[produtos]] `pixNaTela`): QR Code + copia-e-cola da própria
// cobrança, e a confirmação chega aqui mesmo. A fatura do Asaas mostra o CNPJ da Azuris
// no cabeçalho, e quem paga na chave CNPJ faz um PIX que não se liga a venda nenhuma.
//
// Quem confirma é o webhook: a tela só pergunta ao nosso banco (`statusEndpoint`) a cada
// POLL_MS. Fechar a aba não perde nada — o e-mail de confirmação sai do webhook.

const POLL_MS = 5000

export interface PixDaCobranca {
  qrCodeBase64: string
  copiaECola: string
  expiraEm: string | null
}

interface Props {
  pix: PixDaCobranca
  paymentId: string
  valorReais: number
  /** GET ?id=<paymentId> → { status } */
  statusEndpoint: string
  /** fatura do Asaas — saída de emergência se o QR não ler */
  invoiceUrl?: string
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function PixNaTela({ pix, paymentId, valorReais, statusEndpoint, invoiceUrl }: Props) {
  const [pago, setPago] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (pago) return
    let vivo = true
    const t = setInterval(async () => {
      try {
        const r = await fetch(`${statusEndpoint}?id=${encodeURIComponent(paymentId)}`, { cache: 'no-store' })
        if (!r.ok) return
        const d = (await r.json()) as { status?: string }
        if (vivo && d.status === 'paid') setPago(true)
      } catch {
        /* rede caiu — tenta de novo no próximo ciclo */
      }
    }, POLL_MS)
    return () => {
      vivo = false
      clearInterval(t)
    }
  }, [pago, paymentId, statusEndpoint])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix.copiaECola)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      /* clipboard bloqueado — o campo de texto continua selecionável */
    }
  }

  if (pago) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/5 p-6 text-center">
        <div className="text-2xl font-bold text-[var(--accent-emerald)]">Pagamento confirmado!</div>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Recebemos {brl(valorReais)}. Seu ingresso está garantido — a confirmação chega no seu e-mail em instantes.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-5 rounded-2xl border border-[var(--azuris-cyan)]/40 bg-[var(--azuris-deep)] p-6 text-center">
      <div>
        <div className="text-xs uppercase tracking-widest text-[var(--azuris-cyan)]">Pague com PIX</div>
        <div className="mt-1 text-3xl font-black">{brl(valorReais)}</div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Escaneie o QR Code no app do seu banco. Use <strong>este</strong> QR ou o código abaixo — PIX feito direto na
          chave da empresa não se liga ao seu ingresso.
        </p>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element -- data URI do Asaas, nada pra otimizar */}
      <img
        src={`data:image/png;base64,${pix.qrCodeBase64}`}
        alt="QR Code PIX desta cobrança"
        width={240}
        height={240}
        className="mx-auto rounded-xl bg-white p-3"
      />

      <div className="space-y-2 text-left">
        <label htmlFor="pix-copia-cola" className="text-xs font-semibold text-[var(--text-muted)]">
          PIX copia e cola
        </label>
        <textarea
          id="pix-copia-cola"
          readOnly
          rows={3}
          value={pix.copiaECola}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full resize-none break-all rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] p-3 font-mono text-xs text-[var(--text-secondary)]"
        />
        <button
          type="button"
          onClick={copiar}
          className="w-full rounded-lg bg-[var(--azuris-cyan)] px-5 py-3 text-sm font-bold text-[var(--azuris-ink)] transition-opacity hover:opacity-90"
        >
          {copiado ? 'Copiado ✓' : 'Copiar código PIX'}
        </button>
      </div>

      <p className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--azuris-cyan)]" />
        Aguardando o pagamento — esta tela atualiza sozinha.
      </p>
      {invoiceUrl && (
        <p className="text-xs text-[var(--text-muted)]">
          QR não leu?{' '}
          <a href={invoiceUrl} className="text-[var(--azuris-cyan)] underline">
            Abrir a cobrança no Asaas
          </a>
        </p>
      )}
    </div>
  )
}
