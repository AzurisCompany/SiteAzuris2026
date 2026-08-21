'use client'

// Peças compartilhadas pelos botões de copiar da lista de vendas
// (CopiarEmailsButton, CopiarClienteButton). Existem aqui pra não haver uma
// terceira cópia byte-idêntica do fallback de clipboard e dos dois ícones.

export async function copiarTexto(texto: string) {
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

export const IconeCopiar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 012-2h10" />
  </svg>
)

export const IconeCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
