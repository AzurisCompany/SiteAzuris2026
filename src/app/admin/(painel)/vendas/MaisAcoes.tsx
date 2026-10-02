'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Botão "⋯" da coluna Ação: guarda as ações raras (nova cobrança, teste, regerar, cancelar)
 * num menu, pra linha da lista não crescer com uma pilha de botões. Fecha no clique fora e no Esc.
 */
export default function MaisAcoes({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label="Mais ações"
        title="Mais ações"
        className={`rounded-lg border px-2 py-1 text-xs font-bold leading-none transition-colors ${
          aberto
            ? 'border-[var(--azuris-cyan)]/40 text-[var(--azuris-cyan)]'
            : 'border-[var(--azuris-surface)] text-[var(--text-muted)] hover:border-[var(--azuris-cyan)]/40 hover:text-[var(--azuris-cyan)]'
        }`}
      >
        ⋯
      </button>
      {aberto && (
        <div className="absolute right-0 top-full z-20 mt-1 flex min-w-40 flex-col items-stretch gap-1.5 rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-2 text-left shadow-xl [&>*]:text-left">
          {children}
        </div>
      )}
    </div>
  )
}
