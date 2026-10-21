'use client'

import { useState } from 'react'

import { copiarTexto } from '../vendas/copiar'

/**
 * Copia a mensagem pronta (com o link de pagamento) de uma cobrança já gerada — a mesma
 * do form, pra quando o navegador fechou antes de copiar. O texto vem pronto do
 * servidor (`mensagemCobranca`).
 */
export default function CopiarMensagemButton({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await copiarTexto(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copiar}
      title={`Copiar mensagem com o link de pagamento\n\n${texto}`}
      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
        copiado
          ? 'border-[var(--accent-emerald)]/40 text-[var(--accent-emerald)]'
          : 'border-[var(--azuris-surface)] text-[var(--text-muted)] hover:border-[var(--azuris-cyan)]/40 hover:text-[var(--azuris-cyan)]'
      }`}
    >
      {copiado ? 'copiado ✓' : 'copiar msg'}
    </button>
  )
}
