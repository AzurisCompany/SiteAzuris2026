'use client'

import { useState } from 'react'

async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto)
  } catch {
    // Fallback pra contextos sem Clipboard API (http, permissões).
    const ta = document.createElement('textarea')
    ta.value = texto
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

const IconeCopiar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 012-2h10" />
  </svg>
)

const IconeCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

export default function CopiarEmailsButton({
  emails,
  variant = 'full',
  titulo,
}: {
  emails: string[]
  variant?: 'full' | 'icon'
  titulo?: string
}) {
  const [copiado, setCopiado] = useState(false)
  const total = emails.length

  async function copiar(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (total === 0) return
    await copiarTexto(emails.join(', '))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const preview =
    total > 0 ? emails.slice(0, 20).join('\n') + (total > 20 ? `\n… +${total - 20}` : '') : 'Nenhum email'
  const hint = titulo ? `${titulo}\n\n${preview}` : preview

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={copiar}
        disabled={total === 0}
        title={`Copiar ${total} email(s)\n${hint}`}
        aria-label={`Copiar ${total} emails${titulo ? ` de ${titulo}` : ''}`}
        className={`inline-flex items-center justify-center rounded-md p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
          copiado ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-muted)] hover:text-[var(--azuris-cyan)]'
        }`}
      >
        {copiado ? <IconeCheck /> : <IconeCopiar />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={copiar}
      disabled={total === 0}
      title={hint}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        copiado
          ? 'border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]'
          : 'border-[var(--azuris-surface)] text-[var(--text-muted)] hover:border-[var(--azuris-cyan)]/40 hover:text-[var(--azuris-cyan)]'
      }`}
    >
      {copiado ? (
        <>
          <IconeCheck />
          Copiado!
        </>
      ) : (
        <>
          <IconeCopiar />
          Copiar emails ({total})
        </>
      )}
    </button>
  )
}
